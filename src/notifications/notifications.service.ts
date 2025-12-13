import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { db } from 'src/db/drizzle';
import { Notification } from 'src/db/schema';
import { desc } from 'drizzle-orm';

@Injectable()
export class NotificationsService {
  create(createNotificationDto: CreateNotificationDto) {
    return 'This action adds a new notification';
  }

  async findAll(page: number) {
    const offset = (page - 1) * 5; // Calculate how many records to skip
    const notifications = await db
      .select() // Select all columns
      .from(Notification) // From the Notification table
      .orderBy(desc(Notification.createdAt)) // Order by createdAt descending (latest first)
      .limit(5) // Limit the number of rows returned
      .offset(offset); // Skip rows according to the page number

    return notifications; // Return the paginated results
  }
}
