import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { TaskModule } from './tasks/task.module';
import { ContributorsModule } from './contributors/contributors.module';
import { NotificationsModule } from './notifications/notifications.module';
import { InvitationModule } from './invitation/invitation.module.js';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    ProjectModule,
    TaskModule,
    ContributorsModule,
    NotificationsModule,
    InvitationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
