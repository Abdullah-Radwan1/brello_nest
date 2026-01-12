import { Activity, ActivityType } from 'src/db/schema';

async function logActivity(
  tx: any,
  payload: {
    user_id: string;
    project_id: string;
    type: ActivityType;
    entity_type: 'task' | 'project';
    entity_id: string;
    metadata?: Record<string, any>;
  },
) {
  await tx.insert(Activity).values(payload);
}
