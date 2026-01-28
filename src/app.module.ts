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
import { AuthorizationModule } from './assertion/assertion.module.js';
import { AiModule } from './ai/ai.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    ProjectModule,
    TaskModule,
    ContributorsModule,
    NotificationsModule,
    InvitationModule,
    AuthorizationModule,
    AiModule,
    // ThrottlerModule.forRoot([
    //   {
    //     name: 'global',
    //     ttl: 60000, // 60 seconds
    //     limit: 500, // 500 requests per minute globally
    //   },
    //   {
    //     name: 'login',
    //     ttl: 60000,
    //     limit: 30, // 30 login attempts per minute
    //   },
    //   {
    //     name: 'check-name',
    //     ttl: 60000,
    //     limit: 100, // 100 name checks per minute
    //   },
    // ]),
  ],
  controllers: [AppController],
  providers: [
    //   AppService,
    //   {
    //     provide: APP_GUARD,
    //     useClass: ThrottlerGuard,
    //   },
  ],
})
export class AppModule {}
