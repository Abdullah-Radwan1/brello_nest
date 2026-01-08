import { IsString } from 'class-validator';

export class SubmitTaskReviewDto {
  @IsString()
  comment: string;
}
