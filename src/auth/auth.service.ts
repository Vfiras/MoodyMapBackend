    import {
      BadRequestException,
      Injectable,
      InternalServerErrorException,
      NotFoundException,
      UnauthorizedException,
    } from '@nestjs/common';
    import { SignupDto } from './dtos/signup.dto';
    import { InjectModel } from '@nestjs/mongoose';
    import { User, UserType } from './schemas/user.schema';
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
    import { OAuth2Client } from 'google-auth-library';
    import { EditProfileDto } from './dtos/edit-profile.dto';
    import { CompleteAssessmentDto } from './dtos/assessment.dto';
    import { UpdateUserDto } from './dtos/update-user.dto';

    @Injectable()
    export class AuthService {
      private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      constructor(
        @InjectModel(User.name) private UserModel: Model<User>,
        @InjectModel(Event.name) private EventModel: Model<Event>,

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

        //Check if email is in use
        const emailInUse = await this.UserModel.findOne({
          email,
        });
        if (emailInUse) {
          throw new BadRequestException('Email already in use');
        }
        //Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user document and save in mongodb
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
        const accessToken = this.jwtService.sign({ userId }, { algorithm: 'HS256', secret: process.env.JWT_SECRET });
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



      async forgotPassword(email: string) {
        const user = await this.UserModel.findOne({ email });
        if (!user) {
          throw new NotFoundException('User with that email does not exist');
        }

        const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1);

        await this.ResetTokenModel.create({
          userId: user._id.toString(),
          token: resetCode,
          expiryDate,
        });

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
            <h2 style="color: #333;">Hello ${user.name || 'User'},</h2>
            <p style="font-size: 16px; color: #555;">
              We received a request to reset your password for your MoodyMap account. Please use the following code to reset your password:
            </p>
            <div style="text-align: center; margin: 20px 0;">
              <span style="display: inline-block; font-size: 24px; font-weight: bold; color: #007bff; border: 1px dashed #007bff; padding: 10px 20px; border-radius: 5px;">
                ${resetCode}
              </span>
            </div>
            <p style="font-size: 14px; color: #777;">
              This code is valid for the next 1 hour. If you did not request this, please ignore this email.
            </p>
            <p style="font-size: 14px; color: #333; margin-top: 20px;">
              Thank you,<br>
              <strong>The MoodyMap Team</strong>
            </p>
          </div>
        `;

        await this.mailService.sendMail(email, 'Password Reset Code', htmlContent);

        return {
          message: "Password reset code sent to ${email}",
          userId: user._id.toString(),
        };
      }

      async verifyResetCode(userId: string, resetCode: string) {
        const tokenRecord = await this.ResetTokenModel.findOne({
          userId: userId.toString(),
          token: resetCode,
          expiryDate: { $gte: new Date() },
        });

        if (!tokenRecord) {
          throw new UnauthorizedException('Invalid or expired reset code');
        }

        return { message: 'Code verified successfully' };
      }

      async resetPassword(userId: string, newPassword: string) {
        const user = await this.UserModel.findById(userId);
        if (!user) {
          throw new NotFoundException('User not found');
        }

        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = newHashedPassword;
        await user.save();

        // Clean up any reset tokens for this user
        await this.ResetTokenModel.deleteMany({ userId: userId.toString() });

        return { message: 'Password has been successfully updated' };
      }

      async getUserIdByEmail(email: string): Promise<{ userId: string }> {
        const user = await this.UserModel.findOne({ email }).exec();
        
        if (!user) {
          throw new NotFoundException('User not found');
        }
      
        return { userId: user._id.toString() };
      }
    //GOOGLE SIGN IN 
    async verifyGoogleToken(idToken: string) {
      try {
        const ticket = await this.googleClient.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
          throw new UnauthorizedException('Invalid Google ID token');
        }

        const { sub, email, name, picture } = payload;

        const user = await this.findOrCreateUser({ sub, email, name, picture });
        if (!user) {
          throw new InternalServerErrorException('User could not be created or retrieved');
        }

        const tokens = await this.generateUserTokens(user._id);

        return {
          userId: user._id,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        };
      } catch (error) {
        console.error('Error in verifyGoogleToken:', error);
        throw new InternalServerErrorException('Google token verification failed');
      }
    }

    private async findOrCreateUser({ sub, email, name, picture }: { sub: string, email: string, name: string, picture: string }) {
      try {
        let user = await this.UserModel.findOne({ email });

        if (!user) {
          // Generate a random password for Google users
          const randomPassword = uuidv4();
          const hashedPassword = await bcrypt.hash(randomPassword, 10);
          const defaultRoleId = new mongoose.Types.ObjectId("609d1e90fdb3a2421cfa7d55");

          // Create new user with required fields
          user = new this.UserModel({
            googleId: sub,
            email,
            name,
            profilePicture: picture,
            password: hashedPassword,
            confirmPassword: hashedPassword, // Set the same hashed password
            roleId: defaultRoleId,
            otpVerified: true
          });

          await user.save();
        }

        return user;
      } catch (error) {
        console.error('Error in findOrCreateUser:', error);
        throw new InternalServerErrorException('Failed to find or create user');
      }
    }
    //END GOOGLE SIGN IN


    //EDIT PROFILE :
    async editProfile(userId: string, editProfileDto: EditProfileDto) {
      const { name, email, profilePicture } = editProfileDto;

      // Find the user
      const user = await this.UserModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Update the fields
      if (name) user.name = name;
      if (email) {
        const emailExists = await this.UserModel.findOne({ email });
        if (emailExists && emailExists._id.toString() !== userId) {
          throw new BadRequestException('Email already in use by another account');
        }
        user.email = email;
      }
      if (profilePicture) user.profilePicture = profilePicture;

      // Save the updated user
      try {
        await user.save();
        return { message: 'Profile updated successfully', user };
      } catch (error) {
        throw new InternalServerErrorException('Error updating profile');
      }
    }
    async getUserDetails(userId: string): Promise<{ userId: string; name: string; email: string }> {
      const user = await this.UserModel.findById(userId).select('name email').exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
      };
    }
    async getUserById(userId: string) {
      const user = await this.UserModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    }

    async saveAssessmentResult(userId: string, completeAssessmentDto: CompleteAssessmentDto) {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const { userType } = completeAssessmentDto;
      console.log('Request body:', completeAssessmentDto)
      // Find the user
      const user = await this.UserModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Update userType field
      user.userType = userType;
      await user.save();

      return { message: 'Assessment result saved successfully', userType: user.userType };
    }



      // Admin specific methods
      async createAdminUser(signupData: SignupDto) {
        const { email, password, name } = signupData;

        // Check if email is in use
        const emailInUse = await this.UserModel.findOne({ email });
        if (emailInUse) {
          throw new BadRequestException('Email already in use');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Get the admin role ID
        const adminRole = await this.rolesService.getRoleByName('admin');
        if (!adminRole) {
          throw new NotFoundException('Admin role not found');
        }

        // Create admin user
        return await this.UserModel.create({
          name,
          email,
          password: hashedPassword,
          roleId: adminRole._id
        });
      }

      async getAllUsers() {
        return this.UserModel.find().select('name email userType').exec();
      }

      async archiveUser(userId: string) {
        const user = await this.UserModel.findById(userId);
        if (!user) {
          throw new NotFoundException('User not found');
        }

        user.isArchived = true;
        await user.save();
        return { message: 'User archived successfully' };
      }

      async getEventParticipants(eventId: string) {
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
          throw new BadRequestException('Invalid event ID');
        }

        const event = await this.EventModel.findById(eventId)
          .populate<{ participants: User[] }>('participants', 'name email userType')
          .exec();

        if (!event) {
          throw new NotFoundException('Event not found');
        }

        return event.participants;
      }

      async updateUser(userId: string, updateUserDto: UpdateUserDto) {
        // Validate user exists
        const user = await this.UserModel.findById(userId);
        if (!user) {
          throw new NotFoundException('User not found');
        }

        // If email is being updated, check if it's already in use
        if (updateUserDto.email && updateUserDto.email !== user.email) {
          const emailExists = await this.UserModel.findOne({ 
            email: updateUserDto.email,
            _id: { $ne: userId } // Exclude current user from check
          });
          
          if (emailExists) {
            throw new BadRequestException('Email already in use');
          }
        }

        // If roleId is being updated, validate it exists
        if (updateUserDto.roleId) {
          const roleExists = await this.rolesService.getRoleById(updateUserDto.roleId);
          if (!roleExists) {
            throw new BadRequestException('Invalid role ID');
          }
        }

        // Update user
        try {
          const updatedUser = await this.UserModel.findByIdAndUpdate(
            userId,
            {
              $set: {
                ...(updateUserDto.name && { name: updateUserDto.name }),
                ...(updateUserDto.email && { email: updateUserDto.email }),
                ...(updateUserDto.roleId && { roleId: new mongoose.Types.ObjectId(updateUserDto.roleId) }),
                ...(updateUserDto.userType && { userType: updateUserDto.userType }),
              }
            },
            { new: true, runValidators: true }
          );

          return {
            message: 'User updated successfully',
            user: {
              id: updatedUser._id,
              name: updatedUser.name,
              email: updatedUser.email,
              userType: updatedUser.userType,
              roleId: updatedUser.roleId
            }
          };
        } catch (error) {
          if (error.name === 'ValidationError') {
            throw new BadRequestException(error.message);
          }
          throw new InternalServerErrorException('Error updating user');
        }
      }
      async getUserStatistics() {
        try {
          // Total number of users
          const totalUsers = await this.UserModel.countDocuments();
        
        
          // User growth data (new user registrations over time)
          const userGrowthData = await this.UserModel.aggregate([
            {
              $addFields: {
                weekStartDate: { $dateToString: { format: "%Y-W%U", date: "$createdAt" } }
              }
            },
            {
              $group: {
                _id: "$weekStartDate",
                count: { $sum: 1 },
              },
            },
          ]);
        
          // Prepare data for the chart
          const formattedUserGrowthData = userGrowthData.map(item => ({
            date: item._id,
            registrations: item.count,
          }));
        
        
          return {
            totalUsers,
            userGrowthData: formattedUserGrowthData,
          };
        
        } catch (error) {
          throw new InternalServerErrorException('Error fetching user statistics');
        }
      }
      
      async getTotalUsers(): Promise<number> {
        try {
          const userCount = await this.UserModel.countDocuments();
          return userCount;
        } catch (error) {
          console.error('Error fetching user count:', error);
          throw new InternalServerErrorException('Could not fetch user count');
        }
      }

    }
