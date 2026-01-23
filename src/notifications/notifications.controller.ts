import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Patch,
  Param,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from 'src/db/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Fetch all notifications with pagination
  @Get()
  async findAll(
    @CurrentUser() user: { id: string; name: string },
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    return this.notificationsService.getAll(
      user.id,
      user.name,
      pageNum,
      limitNum,
    );
  }

  // Fetch unread notifications only
  @Get('unread')
  async getUnread(
    @CurrentUser() user: { id: string; name: string },
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    return this.notificationsService.getUnread(
      user.id,
      user.name,
      pageNum,
      limitNum,
    );
  }

  // Count unread notifications
  @Get('count')
  async countUnread(@CurrentUser() user: { id: string; name: string }) {
    return this.notificationsService.countUnread(user.id);
  }

  // Mark a notification as read
  @Patch('read/:notification_id')
  async markAsRead(
    @CurrentUser() user: { id: string },
    @Param('notification_id') notification_id: string,
  ) {
    return this.notificationsService.markAsRead(user.id, notification_id);
  }

  // Mark all notifications as read
  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: { id: string; name: string }) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
