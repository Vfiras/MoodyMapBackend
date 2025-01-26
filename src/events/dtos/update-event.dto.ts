import { IsString, IsOptional, IsDate, IsArray } from 'class-validator';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDate()
  date?: Date;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  participants?: string[];
}