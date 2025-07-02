import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Quote, QuoteDocument } from './schemas/quote.schema';
import { GetQuotesQueryDto } from './dto/get-quotes-query.dto';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuoteResponseDto } from './dto/quote-response.dto';
import { UsersService } from '../users/users.service';
@Injectable()
export class QuotesService {
  constructor(
    @InjectModel(Quote.name) private quoteModel: Model<QuoteDocument>,
    @InjectConnection() private connection: Connection,
    private readonly usersService: UsersService,
  ) {}

  async findAll(queryDto: GetQuotesQueryDto, userId?: string): Promise<QuoteResponseDto[]> {
    const { search, sort = 'date_desc' } = queryDto;
    const pipeline: any[] = [];
    
    // Match stage for searching
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { text: { $regex: search, $options: 'i' } },
            { author: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }
    
    // Add a field to indicate if the current user has voted
    // This field is only added if a userId is provided (i.e., the user is logged in)
    pipeline.push({
      $addFields: {
        id: { $toString: '$_id' }, // Convert ObjectId to string and assign to 'id'
        isVoted: userId ? { $in: [userId, '$votedBy'] } : false,
      },
    });

    // Sort stage
    const sortOrder = sort === 'date_asc' ? 1 : -1;
    const sortField = sort === 'votes' ? 'votes' : 'createdAt';
    pipeline.push({ $sort: { [sortField]: sortOrder } });

    // Projection to remove fields we don't want to send to the client. __v is also removed by default.
    pipeline.push({ $project: { votedBy: 0, _id: 0, __v: 0 } });

    return this.quoteModel.aggregate(pipeline).exec();
  }

  async findUserQuotes(userId: string): Promise<QuoteResponseDto[]> {
    const pipeline: any[] = [
      // Step 1: Match quotes created by the specific user
      {
        $match: {
          createdBy: userId,
        },
      },
      // Step 2: Add required fields and transform ObjectId
      {
        $addFields: {
          id: { $toString: '$_id' },
          // For a user's own quotes, they cannot have voted for them.
          isVoted: false,
        },
      },
      // Step 3: Sort by newest first
      {
        $sort: {
          createdAt: -1,
        },
      },
      // Step 4: Project to the final shape, removing unnecessary fields
      {
        $project: {
          _id: 0,
          __v: 0,
          votedBy: 0,
        },
      },
    ];

    return this.quoteModel.aggregate(pipeline).exec();
  }

  async create(createQuoteDto: CreateQuoteDto, userId: string, fallbackFullName: string, fallbackImageUrl: string): Promise<Quote> {
    // Step 1: Try to get the most up-to-date user info from our local DB (synced by webhooks)
    const authorInfo = await this.usersService.findByClerkId(userId);

    // Step 2: Use local DB info if available, otherwise use the fallback from the JWT.
    // This makes the system resilient if the webhook hasn't processed yet.
    const authorName = authorInfo?.fullName || fallbackFullName || 'Anonymous';
    const authorAvatar = authorInfo?.imageUrl || fallbackImageUrl;

    const newQuote = new this.quoteModel({
      ...createQuoteDto,
      author: authorName,
      avatarUrl: authorAvatar,
      createdBy: userId, // Track who created the quote
      votes: 0,
      votedBy: [],
    });
    return newQuote.save();
  }
  
  async vote(id: string, userId: string): Promise<QuoteResponseDto> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Step 1: Find if the user has an existing vote on any quote.
      const previousVoteDoc = await this.quoteModel.findOne({ votedBy: userId }).session(session);

      // Step 2: If a previous vote exists, remove it.
      if (previousVoteDoc) {
        // If the user is trying to vote for the same quote again, it's a conflict.
        if (previousVoteDoc.id === id) {
          throw new ConflictException('You have already voted for this quote.');
        }

        // Remove the old vote
        await this.quoteModel.updateOne(
          { _id: previousVoteDoc._id },
          {
            $inc: { votes: -1 },
            $pull: { votedBy: userId },
          },
          { session }
        );
      }

      // Step 3: Add the new vote to the target quote.
      const updatedQuote = await this.quoteModel.findOneAndUpdate(
        { _id: id },
        {
          $inc: { votes: 1 },
          $push: { votedBy: userId },
        },
        { new: true, session }
      ).exec();

      if (!updatedQuote) {
        throw new NotFoundException(`Quote with ID "${id}" not found`);
      }

      await session.commitTransaction();

      return this.toQuoteResponseDto(updatedQuote, true);
    } catch (error) {
      await session.abortTransaction();
      throw error; // re-throw the original error (e.g., ConflictException)
    } finally {
      session.endSession();
    }
  }

  async unvote(id: string, userId: string): Promise<QuoteResponseDto> {
    // Atomically find a quote by its ID where the user HAS voted
    // and remove their vote.
    const updatedQuote = await this.quoteModel.findOneAndUpdate<QuoteDocument>(
      { _id: id, votedBy: userId }, // Condition: Quote exists and user is in votedBy array
      {
        $inc: { votes: -1 }, // Decrement vote count
        $pull: { votedBy: userId }, // Remove user from the array
      },
      { new: true }, // Return the modified document
    ).exec();

    if (!updatedQuote) {
      // If no document was updated, check if the quote exists at all.
      const quoteExists = await this.quoteModel.exists({ _id: id }).exec();
      if (!quoteExists) {
        throw new NotFoundException(`Quote with ID "${id}" not found`);
      }
      // If the quote exists, it means the user had not voted on it.
      throw new ConflictException('You have not voted for this quote.');
    }

    return this.toQuoteResponseDto(updatedQuote, false);
  }

  async delete(id: string, userId: string): Promise<{ message: string }> {
    const quote = await this.quoteModel.findById(id).exec();

    if (!quote) {
      throw new NotFoundException(`Quote with ID "${id}" not found`);
    }

    if (quote.createdBy !== userId) {
      throw new ForbiddenException('You are not authorized to delete this quote.');
    }

    await this.quoteModel.deleteOne({ _id: id }).exec();
    return { message: 'Quote deleted successfully' };
  }

  private toQuoteResponseDto(quote: QuoteDocument, isVoted: boolean): QuoteResponseDto {
    return {
        id: quote.id,
        text: quote.text,
        author: quote.author,
        avatarUrl: quote.avatarUrl,
        tags: quote.tags,
        votes: quote.votes,
        createdAt: quote.createdAt,
        updatedAt: quote.updatedAt,
        createdBy: quote.createdBy,
        isVoted: isVoted,
    };
  }
}