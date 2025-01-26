import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateStudyPlanDto {
  @IsNotEmpty()
  userId: Types.ObjectId; // User ID for whom the plan is created

  @IsNotEmpty()
  @IsString()
  plan: string; // The content of the study plan
}
