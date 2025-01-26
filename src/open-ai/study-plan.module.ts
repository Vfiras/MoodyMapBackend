import { forwardRef, Module } from '@nestjs/common';
import { StudyPlanService } from './study-plan.service';
import { StudyPlanController } from './study-plan.controller';
import { StudyPlanRepository } from './repositories/study-plan.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { StudyPlan, StudyPlanSchema } from './Schema/StudyPlan.schema';
import { AuthModule } from '../auth/auth.module'; // Import the AuthModule
import { EmotionService } from '../emotion/emotion.service';
import { EmotionModule } from 'src/emotion/emotion.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: StudyPlan.name, schema: StudyPlanSchema }]),
    EmotionModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [StudyPlanController],
  providers: [StudyPlanService, StudyPlanRepository],
  exports: [StudyPlanRepository],
})
export class StudyPlanModule {}
