import { Invitation_enums, Notification_enums, Role_enums } from './schema';

// -------------------------
// Invitation Status
// -------------------------
export const InvitationStatusTS = {
  PENDING: Invitation_enums.enumValues[0],
  ACCEPTED: Invitation_enums.enumValues[1],
  DECLINED: Invitation_enums.enumValues[2],
} as const;

export type InvitationStatus =
  (typeof InvitationStatusTS)[keyof typeof InvitationStatusTS];

// -------------------------
// Notification Types
// -------------------------
export const NotificationTypeTS = {
  INVITATION: Notification_enums.enumValues[0],
  TASK_ASSIGNED: Notification_enums.enumValues[1],
} as const;

export type NotificationType =
  (typeof NotificationTypeTS)[keyof typeof NotificationTypeTS];

// -------------------------
// Roles
// -------------------------
export const RoleEnumTS = {
  CONTRIBUTOR: Role_enums.enumValues[0],
  MANAGER: Role_enums.enumValues[1],
} as const;

export type RoleTS = (typeof RoleEnumTS)[keyof typeof RoleEnumTS];

// -------------------------
// Task Status
// -------------------------
export const TaskStatusTS = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as const;
export type TaskStatus = (typeof TaskStatusTS)[number];

// -------------------------
// Project Input Types
// -------------------------
export type InvitationInput = {
  invited_user_id: string;
};

export type CreateProjectInput = {
  name: string;
  description: string;
  invitations?: InvitationInput[];
};
