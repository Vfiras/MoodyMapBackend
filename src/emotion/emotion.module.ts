// emotion.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmotionService } from './emotion.service';
import { Emotion, EmotionSchema } from './schemas/emotion.schema';
import { EmotionController } from './emotion.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Emotion.name, schema: EmotionSchema }]),
    HttpModule,
  ],
  controllers: [EmotionController],
  providers: [EmotionService],
  exports: [EmotionService], // Make sure EmotionService is exported
})
export class EmotionModule {}
