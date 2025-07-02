import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type QuoteDocument = Quote & Document;

@Schema({ timestamps: true }) // timestamps: true จะสร้าง field createdAt และ updatedAt อัตโนมัติ
export class Quote {
  @Prop({ required: true })
  text!: string;

  @Prop({ required: true })
  author!: string;

  @Prop({ required: false }) // This field is optional
  avatarUrl?: string;

  @Prop({ default: 0 })
  votes!: number;

  @Prop({ type: [String], default: [] })
  votedBy!: string[];

  @Prop([String])
  tags: string[];

  @Prop({ required: true, index: true })
  createdBy!: string; // Clerk User ID of the creator

    // These fields are added by the `timestamps: true` option, but we declare
  // them here to provide type safety with TypeScript.
  createdAt: Date;

  updatedAt: Date;
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);
