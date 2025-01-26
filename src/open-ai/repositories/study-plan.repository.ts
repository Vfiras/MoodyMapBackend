import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StudyPlan } from '../Schema/StudyPlan.schema';

@Injectable()
export class StudyPlanRepository {
  constructor(
    @InjectModel(StudyPlan.name) private readonly studyPlanModel: Model<StudyPlan>,
  ) {}

  async createStudyPlan(userId: Types.ObjectId, plan: string): Promise<StudyPlan> {
    const newPlan = new this.studyPlanModel({ userId, plan });
    return newPlan.save();
  }

  async findStudyPlansByUserId(userId: Types.ObjectId): Promise<StudyPlan[]> {
    return this.studyPlanModel.find({ userId }).exec();
  }

  async updateStudyPlan(id: string, updatedPlan: string): Promise<StudyPlan | null> {
    return this.studyPlanModel
      .findByIdAndUpdate(
        id,
        { plan: updatedPlan, updatedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async deleteStudyPlan(id: string): Promise<StudyPlan | null> {
    return this.studyPlanModel.findByIdAndDelete(id).exec();
  }

  async getStudyPlanById(id: string): Promise<StudyPlan | null> {
    return this.studyPlanModel.findById(id).exec();
  }

  async saveStudyPlan(userId: string, plan: any) {
    const newPlan = new this.studyPlanModel({
      userId: new Types.ObjectId(userId),
      plan,
    });
    return await newPlan.save();
  }

  async getStudyPlanGeneration(period: 'daily' | 'weekly') {
    try {
      const matchDateField = period === 'weekly'
        ? { $dateToString: { format: "%Y-W%U", date: "$createdAt" } }
        : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };

      const aggregationPipeline = [
        {
          $addFields: {
            dateField: matchDateField,
          },
        },
        {
          $group: {
            _id: "$dateField",
            count: { $sum: 1 },
          },
        },
      ];

      return await this.studyPlanModel.aggregate(aggregationPipeline).exec();
    } catch (error) {
      throw new InternalServerErrorException('Error fetching study plan generation data');
    }
  }
}
