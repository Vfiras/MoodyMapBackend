import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignupDto } from './dtos/signup.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './schemas/refresh-token.schema';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { ResetToken } from './schemas/reset-token.schema';
import { MailerService } from 'src/services/mail.service';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(RefreshToken.name)
    private RefreshTokenModel: Model<RefreshToken>,
    @InjectModel(ResetToken.name)
    private ResetTokenModel: Model<ResetToken>,
    private jwtService: JwtService,
    private mailService: MailerService,
    private rolesService: RolesService,
  ) {}

  async signup(signupData: SignupDto) {
    const { email, password, name } = signupData;
  
    if (!password) {
      throw new BadRequestException('Password is required');
    }
  
    // Check if email is in use
    const emailInUse = await this.UserModel.findOne({ email });
    if (emailInUse) {
      throw new BadRequestException('Email already in use');
    }
  
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // Create user document and save in MongoDB
    return await this.UserModel.create({
      name,
      email,
      password: hashedPassword,
    });
  }
  

  async login(credentials: LoginDto) {
    const { email, password } = credentials;
    //Find if user exists by email
    const user = await this.UserModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Wrong credentials');
    }

    //Compare entered password with existing password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong credentials');
    }

    //Generate JWT tokens
    const tokens = await this.generateUserTokens(user._id);
    return {
      ...tokens,
      userId: user._id,
    };
  }

  async changePassword(userId, oldPassword: string, newPassword: string) {
    //Find the user
    const user = await this.UserModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found...');
    }

    //Compare the old password with the password in DB
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong credentials');
    }

    //Change user's password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = newHashedPassword;
    await user.save();
  }

// forgotPassword Method
async forgotPassword(email: string) {
  // Step 1: Check if the email exists in the database
  const user = await this.UserModel.findOne({ email });
  if (!user) {
    throw new NotFoundException('User with that email does not exist');
  }

  // Step 2: Generate a 4-digit reset code
  const resetCode = Math.floor(1000 + Math.random() * 9000); // Generates a 4-digit number between 1000 and 9999

  // Step 3: Set an expiration time for the reset code
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 1); // Code expires in 1 hour

  // Step 4: Store the reset code in the ResetToken collection
  await this.ResetTokenModel.create({
    userId: user._id.toString(), // Ensure userId is stored as a string
    token: resetCode.toString(), // Convert number to string
    expiryDate,
  });

  // Step 5: Send the reset code via email
  await this.mailService.sendMail(email, "Password Reset Code", `Your password reset code is: ${resetCode}`);

  // Step 6: Return a success message
  return { message: `Password reset code sent to ${email}` };
}

// resetPassword Method
async resetPassword(userId: string, newPassword: string, resetCode: string) {
  console.log(`Attempting to reset password for userId: ${userId} with resetCode: ${resetCode}`);

  // Step 1: Check if the token exists and is valid
  const tokenRecord = await this.ResetTokenModel.findOne({
    userId: userId.toString(), // Ensure the userId type matches
    token: resetCode,
    expiryDate: { $gte: new Date() }, // Ensure token hasn't expired
  });

  if (!tokenRecord) {
    console.log("Token record not found or expired");
    throw new UnauthorizedException('Invalid or expired reset code');
  }

  console.log("Token record found, proceeding with password reset");

  // Step 2: Find the user and verify their existence
  const user = await this.UserModel.findById(userId);
  if (!user) {
    console.log("User not found");
    throw new InternalServerErrorException('User not found');
  }

  // Step 3: Hash and update the user's password
  const newHashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = newHashedPassword;
  await user.save();

  console.log("Password successfully updated, deleting reset token");

  // Step 4: Clean up the reset token after successful password reset
  await this.ResetTokenModel.deleteOne({ userId: userId.toString(), token: resetCode });

  return { message: 'Password has been successfully updated' };
}



  async refreshTokens(refreshToken: string) {
    const token = await this.RefreshTokenModel.findOne({
      token: refreshToken,
      expiryDate: { $gte: new Date() },
    });

    if (!token) {
      throw new UnauthorizedException('Refresh Token is invalid');
    }
    return this.generateUserTokens(token.userId);
  }

  async generateUserTokens(userId) {
    const accessToken = this.jwtService.sign({ userId }, { expiresIn: '10h' });
    const refreshToken = uuidv4();

    await this.storeRefreshToken(refreshToken, userId);
    return {
      accessToken,
      refreshToken,
    };
  }

  async storeRefreshToken(token: string, userId: string) {
    // Calculate expiry date 3 days from now
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 3);

    await this.RefreshTokenModel.updateOne(
      { userId },
      { $set: { expiryDate, token } },
      {
        upsert: true,
      },
    );
  }

  async getUserPermissions(userId: string) {
    const user = await this.UserModel.findById(userId);

    if (!user) throw new BadRequestException();

    const role = await this.rolesService.getRoleById(user.roleId.toString());
    return role.permissions;
  }
  async getUserIdByEmail(email: string): Promise<{ userId: string }> {
    const user = await this.UserModel.findOne({ email }).exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    // Return the userId as a JSON object
    return { userId: user._id.toString() };  // Wrap the user ID in an object
  }
  

}
