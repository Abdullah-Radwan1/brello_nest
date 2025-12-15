import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Request,
  Query,
} from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { IsEnum } from 'class-validator';

// ✅ Runtime-safe string enum for invitation status
export const InvitationStatusTS = ['ACCEPTED', 'DECLINED'] as const;
export type InvitationStatusTS = (typeof InvitationStatusTS)[number];

// ✅ DTO for responding to an invitation
// Using a DTO ensures validation and works with ValidationPipe
export class RespondInvitationDto {
  @IsEnum(InvitationStatusTS, {
    message: `Status must be one of: ${InvitationStatusTS.join(', ')}`,
  })
  status: InvitationStatusTS;
}

@Controller('invitation')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  // ---------------------------
  // GET /invitation?page=1
  // Fetch all invitations for the current user, paginated
  // ---------------------------
  @Get()
  getInvitations(@Query('page') page = '1', @Request() req) {
    const currentUserId = req.user.id; // current logged-in user
    const pageNumber = Number(page) || 1; // fallback to page 1
    return this.invitationService.getInvitations(pageNumber, currentUserId);
  }

  // ---------------------------
  // PATCH /invitation/:id
  // Accept or decline an invitation
  // ---------------------------
  @Patch(':id')
  respondToInvitation(
    @Param('id') id: string, // invitation ID from URL
    @Body() dto: RespondInvitationDto, // validated body { status: 'ACCEPTED' | 'DECLINED' }
  ) {
    // ✅ Pass ONLY the string value to service
    // Never pass the Drizzle enum object
    return this.invitationService.respondToInvitation(id, dto.status);
  }
}
