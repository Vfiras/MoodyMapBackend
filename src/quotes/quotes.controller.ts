import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { QuoteService } from './quotes.service';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { QuoteResponse } from './interfaces/quote.interface';

@Controller('quotes')
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Get('daily')
  @UseGuards(AuthenticationGuard)
  async getDailyQuote(@Req() req): Promise<QuoteResponse> {
    const userId = req.user.userId;
    return this.quoteService.getDailyQuote(userId);
  }
}