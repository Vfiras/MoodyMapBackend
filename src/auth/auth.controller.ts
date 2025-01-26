import { Body, Controller, Get, InternalServerErrorException, NotFoundException, Param, Patch, Post, Put, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-tokens.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { VerifyCodeDto } from './dtos/verify-code.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { EditProfileDto } from './dtos/edit-profile.dto';
import { CompleteAssessmentDto } from './dtos/assessment.dto';
import { UserPayload } from './interfaces/user-payload.interfaces';
import { User } from './schemas/user.schema';
import { GetUser } from 'src/decorators/user.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { Resource } from '../roles/enums/resource.enum';
import { Action } from '../roles/enums/action.enum';
import { UpdateUserDto } from './dtos/update-user.dto';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signupData: SignupDto) {
    return this.authService.signup(signupData);
  }

  @Post('login')
  async login(@Body() credentials: LoginDto) {
    return this.authService.login(credentials);
  }

  @Post('refresh')
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @UseGuards(AuthenticationGuard)
  @Put('change-password')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req,
  ) {
    return this.authService.changePassword(
      req.userId,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('verify-code/:userId')
  async verifyCode(
    @Param('userId') userId: string,
    @Body() verifyCodeDto: VerifyCodeDto,
  ) {
    return this.authService.verifyResetCode(userId, verifyCodeDto.resetCode);
  }

  @Post('reset-password/:userId')
  async resetPassword(
    @Param('userId') userId: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(userId, resetPasswordDto.newPassword);
  }

  @Get('get-user-id')
  async getUserIdByEmail(@Query('email') email: string) {
    return this.authService.getUserIdByEmail(email);
  }

  
  @Post('google-signin')
  async googleSignIn(@Body() body: { idToken: string }) {
    const { idToken } = body;
    try {
      const sessionData = await this.authService.verifyGoogleToken(idToken);
      return {
        message: 'Google sign-in successful',
        ...sessionData,
      };
    } catch (error) {
      return {
        message: 'Google sign-in failed',
        error: error.message,
      };
    }
  }
  @UseGuards(AuthenticationGuard)
  @Patch('edit-profile')
  async editProfile(@Body() editProfileDto: EditProfileDto, @Req() req) {
    const userId = req.user.userId; 
    return this.authService.editProfile(userId, editProfileDto);
  }
  @UseGuards(AuthenticationGuard)
@Get('user-details')
async getUserDetails(@Req() req) {
  const userId = req.user.userId; 
  return this.authService.getUserDetails(userId);
}

@Post('submit-assessment')
@UseGuards(AuthenticationGuard)
async saveAssessment(
  @Req() req,
  @Body() completeAssessmentDto: CompleteAssessmentDto
) {
  try {
    const userId = req.user.userId;  
    console.log(`Saving assessment for userId: ${userId}`);

    const result = await this.authService.saveAssessmentResult(userId, completeAssessmentDto);
    console.log('Assessment saved successfully:', result);

    return result;
  } catch (error) {
    console.error('Error saving assessment:', error);
    throw new InternalServerErrorException('Error saving assessment');
  }
}



@Post('admin/create')
  @Permissions([{ resource: Resource.users, actions: [Action.create] }])
  async createAdminUser(@Body() signupData: SignupDto) {
    return this.authService.createAdminUser(signupData);
  }

  @Get('admin/users')
  @UseGuards(AuthenticationGuard)
  @Permissions([{ resource: Resource.users, actions: [Action.read] }])
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Post('admin/users/:userId/archive')
  @UseGuards(AuthenticationGuard)
  @Permissions([{ resource: Resource.users, actions: [Action.update] }])
  async archiveUser(@Param('userId') userId: string) {
    return this.authService.archiveUser(userId);
  }

  @Get('admin/events/:eventId/participants')
  @UseGuards(AuthenticationGuard)
  @Permissions([{ resource: Resource.events, actions: [Action.read] }])
  async getEventParticipants(@Param('eventId') eventId: string) {
    return this.authService.getEventParticipants(eventId);
  }

  @Patch('admin/users/:id')
  @Permissions([{ resource: Resource.users, actions: [Action.update] }])
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.authService.updateUser(id, updateUserDto);
  }
  @Get('summary')
  async getSummary() {
    try {
      const statistics = await this.authService.getUserStatistics();
      return statistics;
    } catch (error) {
      throw new InternalServerErrorException('Error fetching summary data');
    }
  }

 


  

  @Get('user-growth')
  async getUserGrowth() {
    try {
      const userStatistics = await this.authService.getUserStatistics();
      const userGrowthData = userStatistics.userGrowthData;
  
      return userGrowthData;
    } catch (error) {
      throw new InternalServerErrorException('Error fetching user growth data');
    }
  }
  @Get('/admin/users/count')
  async getUserCount() {
    const totalUsers = await this.authService.getTotalUsers();
    return { totalUsers };
  }
}
