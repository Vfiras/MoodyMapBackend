import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuoteController } from './quotes.controller';
import { QuoteService } from './quotes.service';
import { QuoteRepository } from './repositories/quote.repository';
import { Quote, QuoteSchema } from './schemas/quote.schema';
import { EmotionModule } from '../emotion/emotion.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quote.name, schema: QuoteSchema }
    ]),
    EmotionModule,
  ],
  controllers: [QuoteController],
  providers: [QuoteService, QuoteRepository],
  exports: [QuoteService],
})
export class QuotesModule {}