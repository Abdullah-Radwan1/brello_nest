import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { assertionService } from 'src/assertion/assertion.service';

@Module({
  controllers: [TaskController],
  providers: [TaskService, assertionService],
})
export class TaskModule {}
