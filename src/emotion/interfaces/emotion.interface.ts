import { Types } from 'mongoose';

export interface IEmotion {
  emotion: string;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmotionsByDate {
  [date: string]: {
    [emotion: string]: number;
  };
}

export interface EmotionStats {
  emotionsByDate: EmotionsByDate;
  totalEmotions: number;
  dateRange: {
    start: Date;
    end: Date;
  };
}