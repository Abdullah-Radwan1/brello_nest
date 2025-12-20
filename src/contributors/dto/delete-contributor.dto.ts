// remove-contributors.dto.ts
import { IsArray, IsUUID } from 'class-validator';

export class RemoveContributorsDto {
  @IsArray()
  @IsUUID('all', { each: true })
  contributor_ids: string[];

  @IsUUID()
  project_id: string;
}
