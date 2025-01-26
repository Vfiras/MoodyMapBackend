import { IsString, IsNumber, IsDate, IsUrl } from 'class-validator';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsDate()
  date: Date;

  @IsString()
  location: string;

  @IsNumber()
  capacity: number;

  @IsUrl()
  imageUrl: string;
}