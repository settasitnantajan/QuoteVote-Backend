import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Quote } from '../../quotes/schemas/quote.schema';

export type VoteDocument = Vote & Document;

@Schema({ timestamps: true })
export class Vote {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user!: User; // Reference to the User who voted

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Quote', required: true })
  quote!: Quote; // Reference to the Quote that was voted on

  @Prop({ required: true, enum: [1, -1] }) // 1 for upvote, -1 for downvote
  value!: number;
}

export const VoteSchema = SchemaFactory.createForClass(Vote);

// Create an index to ensure that 1 user can only vote for 1 quote once
VoteSchema.index({ user: 1, quote: 1 }, { unique: true });
