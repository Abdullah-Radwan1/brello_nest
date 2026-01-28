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
import { JwtAuthGuard } from './auth/jwt.auth.guard.js';

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
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 1000,
          limit: 30000,
        },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
