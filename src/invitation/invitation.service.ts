import { Injectable, UnauthorizedException } from '@nestjs/common';
import { db } from 'src/db/drizzle';
import {
  Contributor,
  Invitation,
  Notification,
  Project,
  User,
} from 'src/db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { NotificationTypeTS, RoleEnumTS } from 'src/db/types';

import { CreateInvitationDto } from './dto/create-invitation.dto';
import { assertionService } from 'src/assertion/assertion.service';

@Injectable()
export class InvitationService {
  constructor(private readonly assertion: assertionService) {}
  async createInvitation(
    CreateInvitationDto: CreateInvitationDto,
    inviter_id: string,
  ) {
    const existed_invitation = await db
      .select()
      .from(Invitation)
      .where(
        and(
          eq(Invitation.inviter_id, inviter_id),
          eq(Invitation.invited_user_id, CreateInvitationDto.invited_user_id), //todo, select in a project
          eq(Invitation.project_id, CreateInvitationDto.project_id), // Add this if invitations should be unique per project
        ),
      );
    const invitedUser = await db
      .select({ allow_invitation: User.allow_invitations })
      .from(User)
      .where(eq(User.id, CreateInvitationDto.invited_user_id))
      .limit(1); // optional

    if (!invitedUser[0]) {
      throw new UnauthorizedException('User not found');
    }

    // تحقق من allow_invitations
    if (!invitedUser[0].allow_invitation) {
      throw new UnauthorizedException('User does not allow invitations');
    }
    if (existed_invitation[0]) {
      throw new UnauthorizedException('Invitation already have been sent');
    }
    await db.insert(Invitation).values({
      inviter_id,
      invited_user_id: CreateInvitationDto.invited_user_id,
      project_id: CreateInvitationDto.project_id,
    });
  }

  async getUserInvitations(page: number, user_id: string) {
    const limit = 5;
    const offset = (page - 1) * limit;

    const invitations = await db
      .select({
        invitation_id: Invitation.id,
        status: Invitation.status,
        CreatedAt: Invitation.createdAt,
        email: User.email,
        inviterName: User.name,
        project_id: Project.id,
        projectName: Project.name,
        projectDescription: Project.description,
      })
      .from(Invitation)
      .innerJoin(User, eq(User.id, Invitation.inviter_id))
      .innerJoin(Project, eq(Project.id, Invitation.project_id))
      .where(eq(Invitation.invited_user_id, user_id))
      .orderBy(desc(Invitation.createdAt))
      .limit(limit)
      .offset(offset);

    return invitations;
  }
  async getProjectInvitationsfunc(project_id: string) {
    return db
      .select({
        id: Invitation.id,
        email: User.email,
        name: User.name,
        status: Invitation.status,
        CreatedAt: Invitation.createdAt,
        project_id: Invitation.project_id,
      })
      .from(Invitation)
      .leftJoin(User, eq(User.id, Invitation.invited_user_id))
      .where(eq(Invitation.project_id, project_id));
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
          link: `/project/${invitation.project_id}`,
        },
        {
          user_id: invitation.inviter_id,
          type: NotificationTypeTS.INVITATION,
          message:
            status === 'ACCEPTED'
              ? `${invitee.name} accepted your invitation`
              : `${invitee.name} declined your invitation`,
          link: `/project/${invitation.project_id}`,
        },
      ]);

      // 5️⃣ Delete the invitation row after processing
      await tx.delete(Invitation).where(eq(Invitation.id, invitation.id));

      // 6️⃣ Return original invitation info with updated status (frontend-friendly)
      return { ...invitation, status };
    });
  }

  async deleteInvitation(
    user_id: string,
    project_id: string,
    invitation_id: string,
  ) {
    await this.assertion.assertManager(user_id, project_id);
    await db.delete(Invitation).where(eq(Invitation.id, invitation_id));
  }
}
