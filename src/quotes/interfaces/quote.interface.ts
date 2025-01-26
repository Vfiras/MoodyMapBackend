import { Types } from 'mongoose';

export interface IQuote {
  _id?: Types.ObjectId; 
  userId: Types.ObjectId;
  quote: string;
  mood: string;
  createdAt: Date;
  updatedAt: Date;
}


export interface QuoteResponse {
  quote: string;
  mood: string;
  createdAt: Date;
}