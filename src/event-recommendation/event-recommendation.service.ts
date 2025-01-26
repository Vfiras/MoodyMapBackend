import { Injectable, NotFoundException } from '@nestjs/common';
import { OpenAI } from 'openai';
import { EventRecommendationRepository } from './repositories/event-recommendation.repository';
import { EmotionService } from '../emotion/emotion.service';
import { EventsService } from '../events/events.service';
import { Types } from 'mongoose';
import { IEventRecommendation, EventRecommendationResponse } from './interfaces/event-recommendation.interface';

@Injectable()
export class EventRecommendationService {
  private openai: OpenAI;

  constructor(
    private readonly eventRecommendationRepository: EventRecommendationRepository,
    private readonly emotionService: EmotionService,
    private readonly eventsService: EventsService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  async getDailyRecommendations(userId: string): Promise<EventRecommendationResponse> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid userId format');
    }
    const userObjectId = new Types.ObjectId(userId);
  
    const latestEmotion = await this.emotionService.getLatestEmotion(userId);
    if (!latestEmotion) {
      throw new NotFoundException('No emotion data found for this user');
    }
  
    const existingRecommendation = await this.eventRecommendationRepository.findTodayRecommendationByUserId(userObjectId);
  
    let recommendedEventIds: string[];
  
    if (existingRecommendation) {
      recommendedEventIds = existingRecommendation.recommendations;
    } else {
      const allEvents = await this.eventsService.getAllEvents();
      recommendedEventIds = await this.generateRecommendations(latestEmotion.emotion, allEvents);
  
      if (!recommendedEventIds || recommendedEventIds.length === 0) {
        throw new NotFoundException('No suitable recommendations could be generated');
      }
  
      await this.eventRecommendationRepository.saveRecommendation({
        userId: userObjectId,
        recommendations: recommendedEventIds,
        mood: latestEmotion.emotion,
      });
    }
  
    const fullEventDetails = await this.eventsService.getEventByIds(recommendedEventIds);
  
    return {
      recommendations: fullEventDetails,
      mood: latestEmotion.emotion,
      createdAt: existingRecommendation?.createdAt || new Date(),
    };
  }
  
  

  private async generateRecommendations(mood: string, events: any[]): Promise<string[]> {
    const eventDescriptions = events.map(event => ({
      id: event._id.toString(),
      title: event.title,
      description: event.description,
      type: event.type,
    }));

    const prompt = `Based on the user's current mood (${mood}), analyze these events and recommend the most suitable ones that could positively impact their emotional state. Consider the emotional context and potential therapeutic value of each event.

Events to analyze:
${JSON.stringify(eventDescriptions, null, 2)}

Return only an array of event IDs, ordered by relevance, with the most suitable events first. Format: ["id1", "id2", "id3"]`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      });

      const recommendedIds = JSON.parse(response.choices[0].message.content.trim());
      return recommendedIds;
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return [];
    }
  }
}
