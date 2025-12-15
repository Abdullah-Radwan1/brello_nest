import { Injectable } from '@nestjs/common';
import { db } from 'src/db/drizzle';
import {
  Contributor,
  Invitation,
  Notification,
  Project,
  User,
} from 'src/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';
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

  async respondToInvitation(
    id: string,
    status: 'ACCEPTED' | 'DECLINED', // runtime-safe enum string
  ) {
    return await db.transaction(async (tx) => {
      // 1️⃣ Fetch the invitation row by ID
      const [invitation] = await tx
        .select()
        .from(Invitation)
        .where(eq(Invitation.id, id));

      if (!invitation) throw new Error('Invitation not found'); // if no invitation, throw

      // 2️⃣ Fetch both inviter & invitee users using inArray (type-safe)
      const users = await tx
        .select({ id: User.id, name: User.name })
        .from(User)
        .where(
          inArray(User.id, [invitation.inviter_id, invitation.invited_user_id]),
        );

      const inviter = users.find((u) => u.id === invitation.inviter_id); // find inviter
      const invitee = users.find((u) => u.id === invitation.invited_user_id); // find invitee
      if (!inviter || !invitee) throw new Error('User not found'); // sanity check

      // 3️⃣ If invitation is accepted → add invited user as contributor
      if (status === 'ACCEPTED') {
        await tx.insert(Contributor).values({
          project_id: invitation.project_id,
          user_id: invitation.invited_user_id,
          role: RoleEnumTS.CONTRIBUTOR,
        });
      }

      // 4️⃣ Create notifications for both inviter and invitee (batched insert)
      await tx.insert(Notification).values([
        {
          user_id: invitation.invited_user_id,
          type: NotificationTypeTS.INVITATION,
          message:
            status === 'ACCEPTED'
              ? `You joined ${inviter.name}'s project`
              : `You declined ${inviter.name}'s invitation`,
          link: `/projects/${invitation.project_id}`,
        },
        {
          user_id: invitation.inviter_id,
          type: NotificationTypeTS.INVITATION,
          message:
            status === 'ACCEPTED'
              ? `${invitee.name} accepted your invitation`
              : `${invitee.name} declined your invitation`,
          link: `/projects/${invitation.project_id}`,
        },
      ]);

      // 5️⃣ Delete the invitation row after processing
      await tx.delete(Invitation).where(eq(Invitation.id, invitation.id));

      // 6️⃣ Return original invitation info with updated status (frontend-friendly)
      return { ...invitation, status };
    });
  }
}
