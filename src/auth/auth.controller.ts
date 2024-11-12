import { Body, Controller, Get, InternalServerErrorException, NotFoundException, Param, ParseUUIDPipe, Post, Put, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-tokens.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';


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

  @Post('reset-password/:userId')
  async resetPassword(
    @Param('userId') userId: string,  // Removed the ParseUUIDPipe
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    const { newPassword, resetCode } = resetPasswordDto;
  
    try {
      // Call the service to reset the password
      const result = await this.authService.resetPassword(userId, newPassword, resetCode);
      return result;  // Return the result of the password reset
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException('Invalid or expired reset code');
      }
      if (error instanceof InternalServerErrorException) {
        throw new InternalServerErrorException('Error resetting password');
      }
      throw new NotFoundException('User not found');
    }
  }
  
  @Get('get-user-id')
  async getUserIdByEmail(@Query('email') email: string) {
    return this.authService.getUserIdByEmail(email);
  }
}

