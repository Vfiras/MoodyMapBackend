import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema()
export class StudyPlan extends Document {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  plan: string;

  @Prop({ required: false })
  createdAt: Date;
}

export const StudyPlanSchema = SchemaFactory.createForClass(StudyPlan);
