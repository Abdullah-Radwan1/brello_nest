import { IsEnum, IsString } from 'class-validator';

// -------------------------
// Task Status
// -------------------------
export const TaskStatusTS = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as const;
export type TaskStatus = (typeof TaskStatusTS)[number];

export const TaskDecisionsTS = ['APPROVED', 'REJECTED'] as const;
export type TaskDecisions = (typeof TaskDecisionsTS)[number];

export const TaskPriorityTs = ['LOW', 'NORMAL', 'URGENT'] as const;
export type TaskPriority = (typeof TaskPriorityTs)[number];

export class ReviewTaskDTO {
  @IsString()
  reject_comment: string;

  @IsEnum(TaskDecisionsTS)
  decision: TaskDecisions;
}
export class SubmitTaskForReviewDTO {
  @IsString()
  note: string;
}
