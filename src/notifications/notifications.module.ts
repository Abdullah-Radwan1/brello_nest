import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()], // لازم يكون هنا
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
