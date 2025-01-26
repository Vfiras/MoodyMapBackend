import { Test, TestingModule } from '@nestjs/testing';
import { EventRecommendationService } from './event-recommendation.service';

describe('EventRecommendationService', () => {
  let service: EventRecommendationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventRecommendationService],
    }).compile();

    service = module.get<EventRecommendationService>(EventRecommendationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
