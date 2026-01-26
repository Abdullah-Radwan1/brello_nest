import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../db/drizzle';
import {
  Contributor,
  Invitation,
  Notification,
  Project,
  User,
  Activity,
  ActivityTypeEnum,
} from '../db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { RoleEnumTS } from '../db/types';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { assertionService } from '../assertion/assertion.service';

@Injectable()
export class InvitationService {
  constructor(private readonly assertion: assertionService) {}

  // ===============================
  // CREATE INVITATION
  // ===============================
  async createInvitation(dto: CreateInvitationDto, inviter_id: string) {
    const [invitedUser] = await db
      .select({ allow: User.allow_invitations })
      .from(User)
      .where(eq(User.id, dto.invited_user_id))
      .limit(1);

    if (!invitedUser) throw new UnauthorizedException('User not found');
    if (!invitedUser.allow)
      throw new UnauthorizedException('User does not allow invitations');

    const [existing] = await db
      .select()
      .from(Invitation)
      .where(
        and(
          eq(Invitation.project_id, dto.project_id),
          eq(Invitation.invited_user_id, dto.invited_user_id),
        ),
      );

    if (existing) throw new UnauthorizedException('Invitation already sent');

    await db.transaction(async (tx) => {
      const [invitation] = await tx
        .insert(Invitation)
        .values({
          inviter_id,
          invited_user_id: dto.invited_user_id,
          project_id: dto.project_id,
        })
        .returning();

      // 🔔 Notification for invited user
      await tx.insert(Notification).values({
        user_id: dto.invited_user_id,
        type: 'INVITATION',
        message: `You have been invited to join a project`,
        link: '/invitations',
      });

      // 📌 Activity log
      await tx.insert(Activity).values({
        user_id: inviter_id,
        project_id: dto.project_id,
        type: 'INVITATION_SENT',
        entity_type: 'invitation',
        entity_id: invitation.id,
      });
    });
  }

  // ===============================
  // GET USER INVITATIONS
  // ===============================
  async getUserInvitations(page: number, user_id: string) {
    const limit = 5;
    const offset = (page - 1) * limit;

    return db
      .select({
        invitation_id: Invitation.id,
        status: Invitation.status,
        createdAt: Invitation.createdAt,
        inviterName: User.name,
        email: User.email,
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
  }

  async getProjectInvitations(project_id: string) {
    return db
      .select({
        invitation_id: Invitation.id, // Match backend field name
        invitedUserEmail: User.email, // Match backend field name
        invitedUserName: User.name, // Match backend field name
        status: Invitation.status,
        createdAt: Invitation.createdAt,
        project_id: Invitation.project_id, // Add project_id if needed
      })
      .from(Invitation)
      .leftJoin(User, eq(User.id, Invitation.invited_user_id))
      .where(eq(Invitation.project_id, project_id));
  }

  // ===============================
  // RESPOND TO INVITATION
  // ===============================
  async respondToInvitation(
    invitation_id: string,
    status: 'ACCEPTED' | 'DECLINED',
  ) {
    return db.transaction(async (tx) => {
      const [invitation] = await tx
        .select()
        .from(Invitation)
        .where(eq(Invitation.id, invitation_id));

      if (!invitation) throw new NotFoundException('Invitation not found');

      const users = await tx
        .select({ id: User.id, name: User.name })
        .from(User)
        .where(
          inArray(User.id, [invitation.inviter_id, invitation.invited_user_id]),
        );

      const inviter = users.find((u) => u.id === invitation.inviter_id);
      const invitee = users.find((u) => u.id === invitation.invited_user_id);

      if (!inviter || !invitee) throw new NotFoundException('User not found');

      // ➕ Add contributor safely
      if (status === 'ACCEPTED') {
        try {
          await tx.insert(Contributor).values({
            project_id: invitation.project_id,
            user_id: invitation.invited_user_id,
            role: RoleEnumTS.CONTRIBUTOR,
          });
        } catch {
          // ignore duplicate
        }
      }

      // 🔔 Notifications both sides
      await tx.insert(Notification).values([
        {
          user_id: invitation.invited_user_id,
          type: 'INVITATION',
          message:
            status === 'ACCEPTED'
              ? `You joined ${inviter.name}'s project`
              : `You declined ${inviter.name}'s invitation`,
          ...(status === 'ACCEPTED'
            ? { link: `/teamProjects/project/${invitation.project_id}` }
            : { link: null }),
        },
        {
          user_id: invitation.inviter_id,
          type: 'INVITATION',
          message:
            status === 'ACCEPTED'
              ? `${invitee.name} accepted your invitation`
              : `${invitee.name} declined your invitation`,
          ...(status === 'ACCEPTED'
            ? { link: `/myProjects/project/${invitation.project_id}` }
            : { link: null }),
        },
      ]);

      // 📌 Activity log
      await tx.insert(Activity).values({
        user_id: invitation.invited_user_id,
        project_id: invitation.project_id,
        type:
          status === 'ACCEPTED' ? 'INVITATION_ACCEPTED' : 'INVITATION_DECLINED',
        entity_type: 'invitation',
        entity_id: invitation.id,
      });

      // ➖ Remove invitation
      await tx.delete(Invitation).where(eq(Invitation.id, invitation.id));

      return { ...invitation, status };
    });
  }

  // ===============================
  // DELETE INVITATION (MANAGER)
  // ===============================
  async deleteInvitation(
    user_id: string,
    project_id: string,
    invitation_id: string,
  ) {
    await this.assertion.assertManager(user_id, project_id);

    const [invitation] = await db
      .select()
      .from(Invitation)
      .where(eq(Invitation.id, invitation_id));

    if (!invitation) return;

    await db.transaction(async (tx) => {
      // 🔔 Notification
      await tx.insert(Notification).values({
        user_id: invitation.invited_user_id,
        type: 'INVITATION',
        message: `Invitation has been cancelled`,
        link: null,
      });

      // 📌 Activity log
      await tx.insert(Activity).values({
        user_id,
        project_id,
        type: 'INVITATION_CANCELLED',
        entity_type: 'invitation',
        entity_id: invitation.id,
      });

      // ➖ Delete
      await tx.delete(Invitation).where(eq(Invitation.id, invitation.id));
    });
  }
}
