import { Controller, Get, Post, Body, Query, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('page') page = '1', // default to page 1
  ) {
    const current_user_id = req.user.id;
    const pageNum = parseInt(page);
    return this.notificationsService.findAll(current_user_id, pageNum);
  }
}
