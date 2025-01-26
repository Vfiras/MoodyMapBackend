import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

export enum UserType {
  HARD_WORKING = 'Hard working',
  NORMAL_PACE = 'Normal pace',
  LAZY = 'Lazy',
  UNMOTIVATED = 'Unmotivated'
}

@Schema()
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: false, type: SchemaTypes.ObjectId })
  roleId: Types.ObjectId;
  
  @Prop({ required: false })
  profilePicture?: string;

  @Prop({ 
    type: String, 
    required: false 
  })
  userType?: string;
  
  @Prop({ default: false })
  isArchived: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);