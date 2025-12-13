import { Injectable } from '@nestjs/common';
import { db } from 'src/db/drizzle';
import {
  Contributor,
  Invitation,
  Notification,
  Project,
  User,
} from 'src/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import {
  InvitationStatus,
  InvitationStatusTS,
  NotificationTypeTS,
  RoleEnumTS,
} from 'src/db/types';
import { aliasedTable } from 'drizzle-orm';

@Injectable()
export class InvitationService {
  async getInvitations(page: number, userId: string) {
    const limit = 5;
    const offset = (page - 1) * limit;

    const invitations = await db
      .select({
        invitationId: Invitation.id,
        status: Invitation.status,
        sentAt: Invitation.createdAt,

        inviterName: User.name,

        projectName: Project.name,
        projectDescription: Project.description,
      })
      .from(Invitation)
      .innerJoin(User, eq(User.id, Invitation.inviter_id))
      .innerJoin(Project, eq(Project.id, Invitation.project_id))
      .where(eq(Invitation.invited_user_id, userId))
      .orderBy(desc(Invitation.createdAt))
      .limit(limit)
      .offset(offset);

    return invitations;
  }

  async respondToInvitation(id: string, status: InvitationStatus) {
    return await db.transaction(async (tx) => {
      // 1️⃣ Update invitation status and return the updated row
      const [invitation] = await tx
        .update(Invitation)
        .set({ status })
        .where(eq(Invitation.id, id))
        .returning();

      if (!invitation) throw new Error('Invitation not found');

      // 2️⃣ Create ALIASES for User table, We join User twice → inviter & invitee
      const inviter = aliasedTable(User, 'inviter');
      const invitee = aliasedTable(User, 'invitee');

      // 3️⃣ Fetch inviter & invitee names in ONE SQL query
      const [users] = await tx
        .select({
          inviterName: inviter.name,
          inviteeName: invitee.name,
        })
        .from(Invitation)
        .innerJoin(inviter, eq(Invitation.inviter_id, inviter.id))
        .innerJoin(invitee, eq(Invitation.invited_user_id, invitee.id))
        .where(eq(Invitation.id, invitation.id));

      // 4️⃣ If accepted → add invited user as contributor
      if (status === InvitationStatusTS.ACCEPTED) {
        await tx.insert(Contributor).values({
          project_id: invitation.project_id,
          user_id: invitation.invited_user_id,
          role: RoleEnumTS.CONTRIBUTOR,
        });
      }

      // 5️⃣ Notification for INVITED USER
      await tx.insert(Notification).values({
        user_id: invitation.invited_user_id,
        type: NotificationTypeTS.INVITATION,
        message:
          status === InvitationStatusTS.ACCEPTED
            ? `You joined ${users.inviterName}'s project`
            : `You declined ${users.inviterName}'s invitation`,
        link: `/projects/${invitation.project_id}`,
      });
      // 6️⃣ Notification for INVITER
      await tx.insert(Notification).values({
        user_id: invitation.inviter_id,
        type: NotificationTypeTS.INVITATION,
        message:
          status === InvitationStatusTS.ACCEPTED
            ? `${users.inviteeName} accepted your invitation`
            : `${users.inviteeName} declined your invitation`,
        link: `/projects/${invitation.project_id}`,
      });

      return invitation;
    });
  }
}
