import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ timestamps: true })
export class EventRecommendation extends Document {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  mood: string;

  @Prop({ type: [String], required: true })
  recommendations: string[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const EventRecommendationSchema = SchemaFactory.createForClass(EventRecommendation);