import { Test, TestingModule } from '@nestjs/testing';
import { EventRecommendationController } from './event-recommendation.controller';
import { EventRecommendationService } from './event-recommendation.service';

describe('EventRecommendationController', () => {
  let controller: EventRecommendationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventRecommendationController],
      providers: [EventRecommendationService],
    }).compile();

    controller = module.get<EventRecommendationController>(EventRecommendationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
