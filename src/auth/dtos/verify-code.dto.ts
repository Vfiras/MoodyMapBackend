import { IsString, Length } from 'class-validator';

export class VerifyCodeDto {
  @IsString()
  @Length(4, 4)
  resetCode: string;
}