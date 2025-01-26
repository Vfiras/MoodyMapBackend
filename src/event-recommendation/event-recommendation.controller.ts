import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { EventRecommendationService } from './event-recommendation.service';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { EventRecommendationResponse } from './interfaces/event-recommendation.interface';
import { Types } from 'mongoose';

@Controller('events/recommendations')
export class EventRecommendationController {
  constructor(private readonly eventRecommendationService: EventRecommendationService) {}

  @Get('daily') // More specific route
  @UseGuards(AuthenticationGuard)
  async getRecommendations(@Req() req): Promise<EventRecommendationResponse> {
    const userId = req.user.userId; // Ensure userId is valid here too
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid userId format');
    }
    return this.eventRecommendationService.getDailyRecommendations(userId);
  }
}
