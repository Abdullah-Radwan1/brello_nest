import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';

@Module({
  imports: [UsersModule, AuthModule, ProjectModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
