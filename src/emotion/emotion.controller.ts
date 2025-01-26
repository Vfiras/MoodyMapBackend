import { Controller, Post, UseInterceptors, UploadedFile, Req, UseGuards, Get, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as FormData from 'form-data';
import { EmotionService } from './emotion.service';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { EmotionHistoryQueryDto, EmotionStatsQueryDto } from './dtos/emotion-query.dto';
import { EmotionStats, IEmotion } from './interfaces/emotion.interface';

@Controller('emotion')
export class EmotionController {
  constructor(
    private readonly httpService: HttpService,
    private readonly emotionService: EmotionService,
  ) {}

  @Post('detect')
  @UseGuards(AuthenticationGuard)
  @UseInterceptors(FileInterceptor('file'))
  async detectEmotion(@UploadedFile() file: Express.Multer.File, @Req() req): Promise<any> {
    try {
      console.log('Python Model URL:', process.env.PYTHON_MODEL_URL); 
      if (!file) {
        throw new Error('No file uploaded');
      }

      const userId = req.user.userId; 
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Save the uploaded file temporarily
      const uploadsDir = join(__dirname, '..', '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const imagePath = join(uploadsDir, file.originalname);
      fs.writeFileSync(imagePath, file.buffer);

      // Prepare the form data to send the image
      const formData = new FormData();
      formData.append('file', fs.createReadStream(imagePath));

      // Send a POST request to the Python API
      const pythonApiUrl = process.env.PYTHON_MODEL_URL + '/predict';
      const response$ = this.httpService.post(pythonApiUrl, formData, {
        headers: formData.getHeaders(),
      });

      const response = await lastValueFrom(response$);

      // Clean up the temporary file
      fs.unlinkSync(imagePath);

      // Check if the response contains the expected field
      if (!response.data || !response.data.emotion) {
        throw new Error('Invalid response from the Python API');
      }

      const emotion = response.data.emotion;

      // Save emotion to the database with userId
      await this.emotionService.saveEmotion(emotion, userId);

      // Return the emotion and userId in the response
      return { emotion, userId }; // Added userId to the response
    } catch (error) {
      console.error('Error detecting emotion:', error.message);
      throw new Error('Failed to detect emotion. Please try again.');
    }
  }


  ////////////
  @Get('latest')
@UseGuards(AuthenticationGuard)
async getLatestEmotion(@Req() req): Promise<any> {
  try {
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const latestEmotion = await this.emotionService.getLatestEmotion(userId);
    return { emotion: latestEmotion };
  } catch (error) {
    console.error('Error fetching the latest emotion:', error.message);
    throw new Error('Failed to fetch the latest emotion. Please try again.');
  }
}

  
  @Get('history')
  @UseGuards(AuthenticationGuard)
  async getEmotionHistory(
    @Req() req,
    @Query() query: EmotionHistoryQueryDto
  ): Promise<IEmotion[]> {
    const userId = req.user.userId;
    return await this.emotionService.getEmotionHistory(userId, query.limit);
  }

  @Get('stats')
  @UseGuards(AuthenticationGuard)
  async getEmotionStats(
    @Req() req,
    @Query() query: EmotionStatsQueryDto
  ): Promise<EmotionStats> {
    const userId = req.user.userId;
    return await this.emotionService.getEmotionStats(userId, query.days);
  }
  @Get('all-history')
  @UseGuards(AuthenticationGuard)
  async getAllEmotionHistoryLastMonth(@Req() req): Promise<any> {
    try {
      const userId = req.user.userId;
      if (!userId) {
        throw new Error('User not authenticated');
      }
  
      const emotionHistory = await this.emotionService.getAllEmotionHistoryLastMonth();
      return { history: emotionHistory };
    } catch (error) {
      console.error('Error fetching all emotion history for the last month:', error.message);
      throw new Error('Failed to fetch emotion history. Please try again.');
    }
  }
  @Get('counts')
@UseGuards(AuthenticationGuard)
async getAllEmotionCounts(): Promise<any> {
  try {
    const emotionCounts = await this.emotionService.getAllEmotionCounts();
    return { emotionCounts };
  } catch (error) {
    console.error('Error fetching emotion counts:', error.message);
    throw new Error('Failed to fetch emotion counts. Please try again.');
  }
}

}
