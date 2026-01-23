import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Request,
  Query,
  Post,
  Delete,
} from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { IsEnum } from 'class-validator';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { CurrentUser } from '../db/current-user.decoratororator';

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

@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post()
  createInvitaion(
    @Request() req,
    @Body() CreateInvitationDto: CreateInvitationDto,
  ) {
    const currentUserId = req.user.id; // inviter_id
    return this.invitationService.createInvitation(
      CreateInvitationDto,
      currentUserId,
    );
  }
  // Fetch all invitations for the current user, paginated
  // ---------------------------
  @Get()
  getInvitations(@Query('page') page = '1', @Request() req) {
    const currentUserId = req.user.id; // current logged-in user
    const pageNumber = Number(page) || 1; // fallback to page 1
    return this.invitationService.getUserInvitations(pageNumber, currentUserId);
  }

  @Get('/project')
  getProjectInvitations(@Query('project_id') project_id: string) {
    return this.invitationService.getProjectInvitationsfunc(project_id);
  }
  // Accept or decline an invitation
  // ---------------------------
  @Patch(':invitation_id')
  respondToInvitation(
    @Param('invitation_id') invitation_id: string, // invitation ID from URL
    @Body() dto: RespondInvitationDto, // validated body { status: 'ACCEPTED' | 'DECLINED' }
  ) {
    // ✅ Pass ONLY the string value to service
    // Never pass the Drizzle enum object
    return this.invitationService.respondToInvitation(
      invitation_id,
      dto.status,
    );
  }

  @Delete(':invitation_id')
  deleteInvitation(
    @CurrentUser() user,
    @Body('project_id') project_id: string, // ✅ extract string directly
    @Param('invitation_id') invitation_id: string,
  ) {
    return this.invitationService.deleteInvitation(
      user.id,
      project_id,
      invitation_id,
    );
  } // invitation ID from URL
}
