import { Controller, Get, Body, Patch, Param, Request } from '@nestjs/common';
import { InvitationService } from './invitation.service';

import type { InvitationStatus } from 'src/db/types';

@Controller('invitation')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Get()
  getInvitations(@Param('page') page: number, @Request() req) {
    const currentUserId = req.user.id;
    return this.invitationService.getInvitations(page, currentUserId);
  }

  @Patch(':id')
  acceptInvitation(
    @Param('id') id: string,
    @Body() status: InvitationStatus,
    @Request() req,
  ) {
    const currentUserId = req.user.id;
    return this.invitationService.respondToInvitation(id, status);
  }
}
