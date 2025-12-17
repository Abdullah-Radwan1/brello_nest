import { IsString, IsUUID } from 'class-validator';

export class CreateInvitationDto {
  @IsUUID()
  invited_id: string;

  @IsUUID()
  project_id: string;
}
