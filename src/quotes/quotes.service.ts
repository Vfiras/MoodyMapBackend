import { Injectable, NotFoundException } from '@nestjs/common';
import { OpenAI } from 'openai';
import { QuoteRepository } from './repositories/quote.repository';
import { EmotionService } from '../emotion/emotion.service';
import { Types } from 'mongoose';
import { IQuote, QuoteResponse } from './interfaces/quote.interface';

@Injectable()
export class QuoteService {
  private openai: OpenAI;

  constructor(
    private readonly quoteRepository: QuoteRepository,
    private readonly emotionService: EmotionService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async getDailyQuote(userId: string): Promise<QuoteResponse> {
    const userObjectId = new Types.ObjectId(userId);

    console.log('Fetching today\'s quote for user:', userId);

    // Fetch the latest emotion
    const latestEmotion = await this.emotionService.getLatestEmotion(userId);
    if (!latestEmotion) {
      console.error('No emotion data found for this user');
      throw new NotFoundException('No emotion data found for this user');
    }
    console.log('Latest emotion:', latestEmotion);

    // Check if we already have a quote for today
    const existingQuote = await this.quoteRepository.findTodayQuoteByUserId(userObjectId);

    if (existingQuote) {
      console.log('Found existing quote:', existingQuote);

      // Check if the latest emotion is different from the saved quote's mood
      if (existingQuote.mood === latestEmotion.emotion) {
        console.log('Returning existing quote as the mood has not changed.');
        return {
          quote: existingQuote.quote,
          mood: existingQuote.mood,
          createdAt: existingQuote.createdAt,
        };
      } else {
        console.log('Mood has changed. Generating a new quote...');
      }
    }

    // Generate a new quote based on the latest emotion
    const quote = await this.generateQuote(latestEmotion.emotion);
    console.log('Generated quote:', quote);

    const newQuoteData = {
      userId: userObjectId,
      quote: quote,
      mood: latestEmotion.emotion,
    };

    let savedQuote;
    if (existingQuote) {
      // Update the existing quote
      const existingQuoteId = existingQuote._id as Types.ObjectId; // Explicitly assert as ObjectId
      savedQuote = await this.quoteRepository.updateQuote(existingQuoteId, newQuoteData);
      console.log('Updated existing quote:', savedQuote);
    } else {
      // Save a new quote
      savedQuote = await this.quoteRepository.saveQuote(newQuoteData);
      console.log('Saved new quote:', savedQuote);
    }
    

    return {
      quote: savedQuote.quote,
      mood: savedQuote.mood,
      createdAt: savedQuote.createdAt,
    };
  }

  private async generateQuote(mood: string): Promise<string> {
    console.log('Generating quote for mood:', mood);

    const prompt = `Generate an inspiring and uplifting quote that would resonate with someone who is feeling ${mood}. 
    The quote should be motivational and help improve their mood. 
    Keep it concise (maximum 2 sentences) and impactful.
    Return only the quote, without any additional text or attribution.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.7,
    });

    console.log('OpenAI Response:', response.choices[0].message.content.trim());
    return response.choices[0].message.content.trim();
  }
}
