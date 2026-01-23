import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { assertionService } from '../assertion/assertion.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  controllers: [TaskController],

  providers: [TaskService, assertionService, NotificationsService],
})
export class TaskModule {}
