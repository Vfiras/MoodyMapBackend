import { Injectable, NotFoundException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import { InjectModel } from '@nestjs/mongoose';
import { Emotion } from './schemas/emotion.schema';
import { Model, Types } from 'mongoose';
import { EmotionStats, IEmotion } from './interfaces/emotion.interface';

@Injectable()
export class EmotionService {
 
  constructor(
    @InjectModel(Emotion.name) private emotionModel: Model<Emotion>,
  ) {}
  private getPythonCommand(): string {
    // Check if we're on Windows
    const isWindows = os.platform() === 'win32';
    
    // Common Python executable names
    const pythonCommands = isWindows 
      ? ['python', 'python3', 'py']
      : ['python3', 'python'];

    // On Windows, also check specific Python installation paths
    const windowsPythonPaths = isWindows ? [
      'C:\\Python39\\python.exe',
      'C:\\Python310\\python.exe',
      'C:\\Python311\\python.exe',
      'C:\\Program Files\\Python39\\python.exe',
      'C:\\Program Files\\Python310\\python.exe',
      'C:\\Program Files\\Python311\\python.exe',
      'C:\\Users\\' + os.userInfo().username + '\\AppData\\Local\\Programs\\Python\\Python39\\python.exe',
      'C:\\Users\\' + os.userInfo().username + '\\AppData\\Local\\Programs\\Python\\Python310\\python.exe',
      'C:\\Users\\' + os.userInfo().username + '\\AppData\\Local\\Programs\\Python\\Python311\\python.exe'
    ] : [];

    // Combine all possible Python paths
    return [...pythonCommands, ...windowsPythonPaths].find(cmd => {
      try {
        spawn(cmd, ['--version'], { shell: true });
        return true;
      } catch {
        return false;
      }
    }) || 'python'; // fallback to 'python' if nothing else works
  }

  async detectEmotion(imagePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const pythonCommand = this.getPythonCommand();
      const pythonScriptPath = path.join(__dirname, '..', 'python', 'model.py');
      
      console.log(`Using Python command: ${pythonCommand}`);
      console.log(`Script path: ${pythonScriptPath}`);
      console.log(`Image path: ${imagePath}`);

      const pythonProcess = spawn(pythonCommand, [pythonScriptPath, imagePath], {
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
          // Add common Python paths to PATH
          PATH: `${process.env.PATH};` +
                'C:\\Python39;C:\\Python39\\Scripts;' +
                'C:\\Python310;C:\\Python310\\Scripts;' +
                'C:\\Python311;C:\\Python311\\Scripts;' +
                'C:\\Program Files\\Python39;C:\\Program Files\\Python39\\Scripts;' +
                'C:\\Program Files\\Python310;C:\\Program Files\\Python310\\Scripts;' +
                'C:\\Program Files\\Python311;C:\\Program Files\\Python311\\Scripts'
        },
        shell: true
      });

      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
        console.error(`Python stderr: ${data}`);
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Python process exited with code ${code}`);
          console.error(`Error output: ${error}`);
          reject(new Error(`Python process failed with code ${code}: ${error}`));
          return;
        }

        try {
          const parsedResult = JSON.parse(result);
          resolve(parsedResult);
        } catch (e) {
          console.error(`Failed to parse Python output: ${result}`);
          reject(new Error(`Failed to parse Python output: ${result}`));
        }
      });

      pythonProcess.on('error', (err) => {
        console.error(`Failed to start Python process: ${err.message}`);
        reject(new Error(`Failed to start Python process: ${err.message}`));
      });
    });
  }
  async saveEmotion(emotion: string, userId: string): Promise<Emotion> {
    const newEmotion = new this.emotionModel({
      emotion,
      userId: new Types.ObjectId(userId),
    });
    return newEmotion.save();
  }
  async getLatestEmotion(userId: string): Promise<Emotion> {
    const latestEmotion = await this.emotionModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 }); // Sort by most recent
    if (!latestEmotion) {
      throw new NotFoundException('No emotions found for this user');
    }
    return latestEmotion;
  }



  ///////EMOTION STATS AND HISTORY///////////////
  async getEmotionHistory(userId: string, limit: number = 7): Promise<IEmotion[]> {
    const emotions = await this.emotionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    if (!emotions || emotions.length === 0) {
      throw new NotFoundException('No emotions found for this user');
    }

    return emotions;
  }

  async getEmotionStats(userId: string, days: number = 7): Promise<EmotionStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const emotions = await this.emotionModel
      .find({
        userId: new Types.ObjectId(userId),
        createdAt: { $gte: startDate },
      })
      .sort({ createdAt: 1 })
      .lean()
      .exec();
    
    if (!emotions || emotions.length === 0) {
        return {
            emotionsByDate: {},
            totalEmotions: 0,
            dateRange: {
                start: startDate,
                end: new Date()
            }
        };
    }

    const emotionsByDate = emotions.reduce((acc, emotion) => {
      const createdAt = new Date(emotion.createdAt); // Ensure valid date
      if (isNaN(createdAt.getTime())) {
        console.warn('Invalid createdAt date:', emotion.createdAt);
        return acc;
      }
    
      const date = createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {};
      }
      acc[date][emotion.emotion] = (acc[date][emotion.emotion] || 0) + 1;
      return acc;
    }, {});
    

    return {
        emotionsByDate,
        totalEmotions: emotions.length,
        dateRange: {
            start: startDate,
            end: new Date()
        }
    };
}

async getAllEmotionHistoryLastMonth(): Promise<any> {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const emotions = await this.emotionModel
    .find({
      createdAt: { $gte: oneMonthAgo },
    })
    .lean()
    .exec();

  if (!emotions || emotions.length === 0) {
    return [];
  }

  const emotionCounts = emotions.reduce((acc, emotion) => {
    acc[emotion.emotion] = (acc[emotion.emotion] || 0) + 1;
    return acc;
  }, {});

  const formattedResponse = Object.keys(emotionCounts).flatMap(mood => ({
    mood,
    count: emotionCounts[mood]
  }));

  return formattedResponse;
}

async getAllEmotionCounts(): Promise<any> {
  const emotionCounts = await this.emotionModel.aggregate([
    {
      $group: {
        _id: '$emotion', // Group by the 'emotion' field
        count: { $sum: 1 }, // Count the occurrences
      },
    },
  ]);

  if (!emotionCounts || emotionCounts.length === 0) {
    return [];
  }

  // Format the response to return emotion and count
  return emotionCounts.map((emotionData) => ({
    emotion: emotionData._id,
    count: emotionData.count,
  }));
}


}