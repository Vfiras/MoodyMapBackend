import { PartialType } from '@nestjs/mapped-types';
import { CreateEventRecommendationDto } from './create-event-recommendation.dto';

export class UpdateEventRecommendationDto extends PartialType(CreateEventRecommendationDto) {}
