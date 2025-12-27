import { Module } from '@nestjs/common';
import { assertionService } from './assertion.service';

@Module({
  providers: [assertionService],
  exports: [assertionService],
})
export class AuthorizationModule {}
