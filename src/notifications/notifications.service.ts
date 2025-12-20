import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { db } from 'src/db/drizzle';
import { Notification, User } from 'src/db/schema';
import { desc, eq } from 'drizzle-orm';

@Injectable()
export class NotificationsService {
  create(createNotificationDto: CreateNotificationDto) {
    return 'This action adds a new notification';
  }

  async findAll(user_id: string, page: number) {
    const offset = (page - 1) * 5; // Calculate how many records to skip
    const notifications = await db
      .select() // Select all columns
      .from(Notification) // From the Notification table
      .orderBy(desc(Notification.createdAt)) // Order by createdAt descending (latest first)
      .where(eq(User.id, user_id))
      .limit(5) // Limit the number of rows returned
      .offset(offset); // Skip rows according to the page number

    return notifications; // Return the paginated results
  }
}
