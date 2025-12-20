import { IsString, IsUUID } from 'class-validator';

export class CreateInvitationDto {
  @IsUUID()
  invited_user_id: string;

  @IsUUID()
  project_id: string;
}
