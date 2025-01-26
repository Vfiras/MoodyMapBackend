import { IsOptional, IsString } from 'class-validator';

export class UpdateStudyPlanDto {
  @IsOptional()
  @IsString()
  plan?: string; // The updated study plan content
}
