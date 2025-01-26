import { Types } from 'mongoose';

export interface IEventRecommendation {
  userId: Types.ObjectId;
  mood: string;
  recommendations: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EventRecommendationResponse {
  recommendations: any[]; // Updated to store full event details
  mood: string;
  createdAt: Date;
}
