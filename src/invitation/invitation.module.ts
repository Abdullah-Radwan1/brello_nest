import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { assertionService } from 'src/assertion/assertion.service';

@Module({
  controllers: [InvitationController],
  providers: [InvitationService, assertionService],
})
export class InvitationModule {}
