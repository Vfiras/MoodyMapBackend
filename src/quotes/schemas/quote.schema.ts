import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Quote extends Document {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  quote: string;

  @Prop({ required: true })
  mood: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
  _id: Types.ObjectId;
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);