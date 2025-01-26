import { IsString, IsOptional, IsEmail } from 'class-validator';

export class GoogleSignInDto {
  @IsString()
  sub: string;  // The Google ID (unique identifier)

  @IsEmail()
  email: string;  // User's email from Google

  @IsString()
  name: string;  // User's name from Google

  @IsOptional()
  @IsString()
  profilePicture?: string;  // User's profile picture URL (optional)
}