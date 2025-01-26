import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventRecommendation } from '../schemas/event-recommendation.schema';
import { IEventRecommendation } from '../interfaces/event-recommendation.interface';

@Injectable()
export class EventRecommendationRepository {
  constructor(
    @InjectModel(EventRecommendation.name)
    private readonly eventRecommendationModel: Model<EventRecommendation>,
  ) {}

  async saveRecommendation(recommendation: Partial<IEventRecommendation>): Promise<EventRecommendation> {
    const newRecommendation = new this.eventRecommendationModel(recommendation);
    return newRecommendation.save();
  }

  async findTodayRecommendationByUserId(userId: Types.ObjectId): Promise<EventRecommendation | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.eventRecommendationModel
      .findOne({
        userId,
        createdAt: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      })
      .exec();
  }
}