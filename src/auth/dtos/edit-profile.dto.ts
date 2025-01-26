// dtos/edit-profile.dto.ts
import { IsOptional, IsString, IsEmail } from 'class-validator';

export class EditProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string; // Optional if you support profile pictures
}
