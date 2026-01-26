import { Injectable } from '@nestjs/common';
import { Notification } from '../db/schema';
import { and, eq, sql, desc, lt } from 'drizzle-orm';
import { db } from '../db/drizzle';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class NotificationsService {
  // Fetch all notifications with pagination, include sender name
  async getAll(user_id: string, user_name: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [notifications, countResult] = await Promise.all([
      db
        .select({
          id: Notification.id,
          type: Notification.type,
          message: Notification.message,
          link: Notification.link,
          read: Notification.read,
          createdAt: Notification.createdAt,
        })
        .from(Notification)
        .where(eq(Notification.user_id, user_id))
        .orderBy(desc(Notification.createdAt))
        .limit(limit)
        .offset(offset),

      db
        .select({ count: sql<number>`count(*)` })
        .from(Notification)
        .where(eq(Notification.user_id, user_id)),
    ]);

    const total = Number(countResult[0]?.count || 0);

    return {
      notifications: notifications.map((n) => ({
        ...n,
        user_name, // attach current user name
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Fetch unread notifications only
  async getUnread(user_id: string, user_name: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const notifications = await db
      .select({
        id: Notification.id,
        type: Notification.type,
        message: Notification.message,
        link: Notification.link,
        read: Notification.read,
        createdAt: Notification.createdAt,
      })
      .from(Notification)
      .where(
        and(eq(Notification.user_id, user_id), eq(Notification.read, false)),
      )
      .orderBy(desc(Notification.createdAt))
      .limit(limit)
      .offset(offset);

    return notifications.map((n) => ({
      ...n,
      user_name, // attach current user name
    }));
  }

  // Count unread notifications
  async countUnread(user_id: string) {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(Notification)
      .where(
        and(eq(Notification.user_id, user_id), eq(Notification.read, false)),
      );

    return result[0]?.count || 0;
  }

  // Mark a single notification as read
  async markAsRead(user_id: string, notification_id: string) {
    if (!user_id) throw new Error('user_id is required');
    if (!notification_id) throw new Error('notification_id is required');
    const [updated] = await db
      .update(Notification)
      .set({ read: true })
      .where(
        and(
          eq(Notification.user_id, user_id),
          eq(Notification.id, notification_id),
        ),
      )
      .returning();

    return updated;
  }

  // Mark all notifications as read
  async markAllAsRead(user_id: string) {
    return await db
      .update(Notification)
      .set({ read: true })
      .where(eq(Notification.user_id, user_id))
      .returning();
  }

  // Runs every 48 hours (48 * 60 * 60 * 1000 ms)
  @Cron('0 0 */2 * *') // runs every 2 days at midnight
  async deleteOldNotifications() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 2); // 2 days old

    await db
      .delete(Notification)
      .where(lt(Notification.createdAt, cutoff))
      .returning();
  }
}
