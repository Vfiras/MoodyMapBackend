import { forwardRef, Module } from '@nestjs/common';
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
import { JwtModule } from '@nestjs/jwt';
import { EventsModule } from '../events/events.module';
import { EmotionModule } from 'src/emotion/emotion.module';
import { StudyPlanModule } from 'src/open-ai/study-plan.module';

@Module({
  imports: [
    RolesModule,
    EventsModule,
    
    JwtModule.register({
      secret: 'your_jwt_secret_key',
      signOptions: { expiresIn: '10h' },
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
  exports: [AuthService, MongooseModule],
})
export class AuthModule {}