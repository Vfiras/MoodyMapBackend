import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event } from './schemas/event.schema';
import { CreateEventDto } from './dtos/create-event.dto';
import * as PDFDocument from 'pdfkit';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { UpdateEventDto } from './dtos/update-event.dto';

@Injectable()
export class EventsService {
  private readonly vouchersDir = join(process.cwd(), 'vouchers');

  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
  ) {
    this.ensureVouchersDirectoryExists();
  }

  private ensureVouchersDirectoryExists(): void {
    const fs = require('fs');
    const dirPath = this.vouchersDir;
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async createEvent(createEventDto: CreateEventDto): Promise<Event> {
    const event = new this.eventModel(createEventDto);
    return event.save();
  }

  async getAllEvents(): Promise<Event[]> {
    console.log('Fetching all events from database...');
    const events = await this.eventModel.find().exec();
    console.log(`Found ${events.length} events in database:`, events);
    return events;
  }

  async getEventById(id: string): Promise<Event> {
    const event = await this.eventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async getEventsByIds(eventIds: string[]): Promise<Event[]> {
    return this.eventModel.find({ _id: { $in: eventIds } }).exec();
  }
  
  async getEventByIds(recommendedEventIds: string[]): Promise<any[]> {
    return this.eventModel.find({ _id: { $in: recommendedEventIds } }).exec();
  }
  async getNumberOfEvents(): Promise<number> {
    console.log('Counting number of events in the database...');
    const count = await this.eventModel.countDocuments().exec();
    console.log(`Found ${count} events in the database`);
    return count;
  }
  

  async participateInEvent(eventId: string, userId: string): Promise<Event> {
    if (!Types.ObjectId.isValid(eventId)) {
      throw new BadRequestException('Invalid event ID format');
    }
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const eventObjectId = new Types.ObjectId(eventId);
    const userObjectId = new Types.ObjectId(userId);

    const event = await this.eventModel.findById(eventObjectId).exec();
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (
      !event.participants.some(
        (id) => id instanceof Types.ObjectId && id.equals(userObjectId),
      )
    ) {
      event.participants.push(userObjectId);
      await event.save();
    }

    return event;
  }

  async generateParticipationVoucher(eventId: string, userId: string): Promise<string> {
    const event = await this.getEventById(eventId);

    this.ensureVouchersDirectoryExists();

    const filePath = join(this.vouchersDir, `${eventId}-${userId}.pdf`);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4' });
      const stream = createWriteStream(filePath);

      stream.on('error', (error) => {
        reject(error);
      });

      stream.on('finish', () => {
        resolve(filePath);
      });

      doc.pipe(stream);

      doc.rect(0, 0, 595, 842).fill('#f5f5f5');

      doc.fontSize(30)
        .font('Helvetica-Bold')
        .fillColor('#4CAF50')
        .text('Event Participation Voucher', 180, 60, { align: 'center' });

      doc.rect(40, 120, 515, 700).strokeColor('#2196F3').lineWidth(4).stroke();

      doc.fontSize(18)
        .font('Helvetica')
        .fillColor('#333333')
        .text(`Event Name: ${event.title}`, 60, 160);
      doc.fontSize(16)
        .text(`Date: ${event.date.toLocaleDateString()}`, 60, 190);

      const logoPath = join(process.cwd(), 'vouchers', 'logo.png');
      if (existsSync(logoPath)) {
        doc.image(logoPath, 400, 150, { width: 150 });
      } else {
        console.warn(`Logo file not found at ${logoPath}`);
      }

      doc.fontSize(20)
        .fillColor('#FF5722')
        .text('Thank you for participating!', 180, 500, { align: 'center' });

      doc.lineWidth(2);
      doc.strokeColor('#4CAF50').rect(40, 120, 515, 700).stroke();

      doc.fontSize(12)
        .fillColor('#999999')
        .text('For more information, contact us at: info@event.com', 180, 750, { align: 'center' });

      doc.end();
    });
  }

  async updateEvent(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.eventModel.findById(id);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    Object.assign(event, updateEventDto);
    return event.save();
  }

  async deleteEvent(id: string): Promise<void> {
    const result = await this.eventModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Event not found');
    }
  }
}
