import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quote } from '../schemas/quote.schema';
import { IQuote } from '../interfaces/quote.interface';

@Injectable()
export class QuoteRepository {
  constructor(
    @InjectModel(Quote.name) private readonly quoteModel: Model<Quote>,
  ) {}

  async saveQuote(quote: Partial<IQuote>): Promise<Quote> {
    const newQuote = new this.quoteModel(quote);
    return newQuote.save();
  }

  async findTodayQuoteByUserId(userId: Types.ObjectId): Promise<Quote | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.quoteModel
      .findOne({
        userId,
        createdAt: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      })
      .exec();
  }

  async updateQuote(quoteId: Types.ObjectId, updatedData: Partial<IQuote>): Promise<Quote> {
    return this.quoteModel
      .findByIdAndUpdate(
        quoteId,
        { $set: updatedData },
        { new: true }, // Return the updated document
      )
      .exec();
  }
}
