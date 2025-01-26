import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { OpenAI } from 'openai';
import { StudyPlanRepository } from './repositories/study-plan.repository';
import { AuthService } from '../auth/auth.service';
import { EmotionService } from '../emotion/emotion.service';
import { Types } from 'mongoose';

@Injectable()
export class StudyPlanService {
  private openai: OpenAI;

  constructor(
    private readonly studyPlanRepository: StudyPlanRepository,
    private readonly userService: AuthService,
    private readonly emotionService: EmotionService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generates a structured study plan based on user data, latest emotion (optional), and exam date.
   * @param userId - The ID of the user
   * @param examDate - The date of the exam
   * @returns Generated study plan and prompt
   */
  async generateStudyPlan(userId: string, examDate: string): Promise<any> {
    try {
      // Retrieve user data
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found.`);
      }

      // Retrieve latest emotion (optional)
      const latestEmotion = await this.emotionService.getLatestEmotion(userId);

      // If emotion data is not available, set it to a default value
      const emotion = latestEmotion ? latestEmotion.emotion : 'neutral';

      // Create the prompt for OpenAI
      const prompt = this.createPrompt(user.userType, emotion, examDate);

      // Call OpenAI API to generate the study plan
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      });

      const plan = response.choices?.[0]?.message?.content;
      if (!plan) {
        throw new InternalServerErrorException('Failed to generate a study plan.');
      }

      // Save the study plan to the database
      await this.studyPlanRepository.saveStudyPlan(userId, plan);

      return { plan, prompt };
    } catch (error) {
      console.error('Error generating study plan:', error.message);
      throw new InternalServerErrorException('An error occurred while generating the study plan.');
    }
  }

 /**
 * Calculates the number of days from today until the exam date.
 * @param examDate - The exam date in 'YYYY-MM-DD' format
 * @returns Number of days until the exam
 */
private calculateDaysUntilExam(examDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Remove the time component to avoid partial day issues

  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0); // Ensure the time component is removed for accurate comparison

  const differenceInTime = exam.getTime() - today.getTime();
  const differenceInDays = Math.ceil(differenceInTime / (1000 * 60 * 60 * 24));

  if (differenceInDays < 0) {
    throw new Error('The exam date must be in the future.');
  }

  return differenceInDays;
}


  /**
   * Creates a personalized prompt for the study plan generation.
   * @param userType - The type of user
   * @param emotion - The user's current emotional state (optional)
   * @param examDate - The exam date
   * @returns A formatted string as the prompt
   */
  private createPrompt(userType: string, emotion: string, examDate: string): string {
    const daysUntilExam = this.calculateDaysUntilExam(examDate);

    const dailyPlan = Array.from(
      { length: daysUntilExam },
      (_, i) => `DAY ${i + 1}: Generate a study plan for day ${i + 1}.`
    ).join('\n');

    return `
       L'utilisateur est ${userType} et se sent ${emotion}.
      Il a un examen prévu le ${examDate}.
  
      Génère un plan de révision structuré pour chaque jour jusqu'à l'examen :
  
      ${dailyPlan}
  
      Veuillez inclure des recommandations claires pour chaque jour, en variant les tâches : 
      par exemple, étude, révision, pratique d'examens ou gestion du stress.

      
    `;
  }

  async getHistory(userId: string) {
    try {
      return await this.studyPlanRepository.findStudyPlansByUserId(new Types.ObjectId(userId));
    } catch (error) {
      throw new Error(`Unable to fetch study plan history: ${error.message}`);
    }
  }

  /**
   * Fetches the number of study plans generated daily or weekly.
   * @param period - 'daily' or 'weekly'
   * @returns A line graph data showing the number of study plans generated per day or per week
   */
  async getStudyPlanGeneration(period: 'daily' | 'weekly') {
    try {
      const userStudyPlanData = await this.studyPlanRepository.getStudyPlanGeneration(period);

      const formattedData = userStudyPlanData.map((item) => ({
        date: item._id,
        generations: item.count,
      }));

      return formattedData;
    } catch (error) {
      throw new InternalServerErrorException('Error fetching study plan generation data');
    }
  }
}
