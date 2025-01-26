import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { StudyPlanService } from './study-plan.service';
import { AuthenticationGuard } from 'src/guards/authentication.guard';

@Controller('study-plan')
export class StudyPlanController {
  constructor(private readonly studyPlanService: StudyPlanService) {}

  @UseGuards(AuthenticationGuard)
  @Post()
  async generateStudyPlan(@Body('examDate') examDate: string, @Req() req) {
    const userId = req.user.userId;  
    return this.studyPlanService.generateStudyPlan(userId, examDate);
  }

  @UseGuards(AuthenticationGuard)
  @Get('/generation')
  async getStudyPlanGeneration(@Body('period') period: 'daily' | 'weekly', @Req() req) {
    const userId = req.user.userId;  
    return this.studyPlanService.getStudyPlanGeneration(period);
  }
}
