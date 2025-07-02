import { Controller, Get, Post, Delete, Param, Query, Req, UseGuards, Body } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { GetQuotesQueryDto } from './dto/get-quotes-query.dto';
import { ClerkAuthGuard } from '@/auth/clerk-auth.guard';
import { GetAuth } from '@/auth/get-auth.decorator';
import { QuoteResponseDto } from './dto/quote-response.dto';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { Quote } from './schemas/quote.schema';

// Define a type for the request object after Clerk middleware
interface ClerkRequest extends Request {
  auth?: {
    userId?: string;
    fullName?: string;
    imageUrl?: string;
  };
}

@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  findAll(@Query() queryDto: GetQuotesQueryDto, @Req() req: ClerkRequest): Promise<QuoteResponseDto[]> {
    // The ClerkExpressWithAuth middleware adds the `auth` object to the request.
    // It will be present if the user is authenticated, and undefined otherwise.
    const userId = req.auth?.userId;
    return this.quotesService.findAll(queryDto, userId);
  }

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  findMyQuotes(@GetAuth() auth: { userId: string }): Promise<QuoteResponseDto[]> {
    // This new endpoint will fetch all quotes created by the currently authenticated user.
    return this.quotesService.findUserQuotes(auth.userId);
  }

  @Post()
  @UseGuards(ClerkAuthGuard)
  create(
    @Body() createQuoteDto: CreateQuoteDto,
    @GetAuth() auth: { userId: string; fullName: string; imageUrl: string },
  ): Promise<Quote> {
    return this.quotesService.create(
      createQuoteDto,
      auth.userId,
      auth.fullName,
      auth.imageUrl,
    );
  }

  @Post(':id/vote')
  @UseGuards(ClerkAuthGuard)
  vote(@Param('id') id: string, @GetAuth() auth: { userId: string }): Promise<QuoteResponseDto> {
    return this.quotesService.vote(id, auth.userId);
  }

  @Delete(':id/vote')
  @UseGuards(ClerkAuthGuard)
  unvote(@Param('id') id: string, @GetAuth() auth: { userId: string }): Promise<QuoteResponseDto> {
    return this.quotesService.unvote(id, auth.userId);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  delete(@Param('id') id: string, @GetAuth() auth: { userId: string }): Promise<{ message: string }> {
    return this.quotesService.delete(id, auth.userId);
  }
}