import { IsNumber, Min, Max, IsString } from 'class-validator';

export class CompleteAssessmentDto {
    @IsString()
    userType: string;
}