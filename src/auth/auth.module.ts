import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import {
  RefreshToken,
  RefreshTokenSchema,
} from './schemas/refresh-token.schema';
import { ResetToken, ResetTokenSchema } from './schemas/reset-token.schema';
import { MailerService } from 'src/services/mail.service';
import { RolesModule } from 'src/roles/roles.module';
import { JwtModule } from '@nestjs/jwt'; // Import JwtModule

@Module({
  imports: [
    RolesModule,
    JwtModule.register({
      secret: 'your_jwt_secret_key', // Set your secret key here
      signOptions: { expiresIn: '10h' }, // Set default expiration
    }),
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: RefreshToken.name,
        schema: RefreshTokenSchema,
      },
      {
        name: ResetToken.name,
        schema: ResetTokenSchema,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, MailerService],
  exports: [AuthService],
})
export class AuthModule {}
