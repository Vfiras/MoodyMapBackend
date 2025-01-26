import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema()
export class Emotion extends Document {
  @Prop({ required: true })
  emotion: string;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
  userId: Types.ObjectId;
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop()
  updatedAt: Date;

}

export const EmotionSchema = SchemaFactory.createForClass(Emotion);
