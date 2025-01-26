import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsController } from '../events/events.controller';
import { EventsService } from '../events/events.service';
import { Event, EventSchema } from '../events/schemas/event.schema';
import { EventRecommendation, EventRecommendationSchema } from './schemas/event-recommendation.schema';
import { EventRecommendationController } from './event-recommendation.controller';
import { EventRecommendationService } from './event-recommendation.service';
import { EventRecommendationRepository } from './repositories/event-recommendation.repository';
import { EmotionModule } from '../emotion/emotion.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: EventRecommendation.name, schema: EventRecommendationSchema }
    ]),
    EmotionModule,
  ],
  controllers: [EventsController, EventRecommendationController],
  providers: [
    EventsService,
    EventRecommendationService,
    EventRecommendationRepository
  ],
  exports: [EventsService, EventRecommendationService],
})
export class EventRecommendationModule {}