import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';

import { assertionService } from '../assertion/assertion.service';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService, assertionService],
})
export class ProjectModule {}
