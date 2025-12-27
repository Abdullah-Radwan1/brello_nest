import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';

import { AuthorizationModule } from 'src/assertion/assertion.module';
import { assertionService } from 'src/assertion/assertion.service';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService, assertionService],
})
export class ProjectModule {}
