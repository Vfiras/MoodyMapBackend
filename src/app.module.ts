import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtModule } from '@nestjs/jwt';
import config from './config/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { EmotionModule } from './emotion/emotion.module';
import { StudyPlanModule } from './open-ai/study-plan.module';
import { EventsModule } from './events/events.module';
import { ClientModule } from './client/client.module';
import { QuotesModule } from './quotes/quotes.module';
import { EventRecommendationModule } from './event-recommendation/event-recommendation.module';
import * as Joi from '@hapi/joi';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [config],
      envFilePath: '.env',
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().required(),
        MONGO_URL: Joi.string().required(),
        GOOGLE_CLIENT_ID: Joi.string().required(),
        GMAIL_USER: Joi.string().required(),
        GMAIL_PASS: Joi.string().required(),
        OPENAI_API_KEY: Joi.string().required(),
        PYTHON_MODEL_URL: Joi.string().required(),
      }),
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config) => ({
        secret: config.get('jwt.secret'),
      }),
      global: true,
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config) => ({
        uri: config.get('database.connectionString'), 
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    RolesModule,
    EmotionModule,
    StudyPlanModule,
    EventsModule,
    ClientModule,
    QuotesModule,
    EventRecommendationModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
