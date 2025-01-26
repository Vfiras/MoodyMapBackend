import { Controller, Get, Post, Body, Param, UseGuards, BadRequestException, Res, Patch, Delete } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dtos/create-event.dto';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { GetUser } from '../decorators/user.decorator';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { Action } from '../roles/enums/action.enum';
import { Resource } from '../roles/enums/resource.enum';
import { UpdateEventDto } from './dtos/update-event.dto';
import { Permissions } from '../decorators/permissions.decorator';
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(AuthenticationGuard)
  @Permissions([{ resource: Resource.events, actions: [Action.create] }])
  async createEvent(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.createEvent(createEventDto);
  }

  @Get()
  async getAllEvents() {
    console.log('GET /events endpoint called');
    const events = await this.eventsService.getAllEvents();
    console.log(`Returning ${events.length} events to client`);
    return events;
  }
  @Get('/count') 
  async getNumberOfEvents() {
    console.log('GET /events/count endpoint called');
    const count = await this.eventsService.getNumberOfEvents();
    console.log(`Number of events: ${count}`);
    return { count };
  }
  @Get(':id') 
  async getEventById(@Param('id') id: string) {
    return this.eventsService.getEventById(id);
  }

  @Post(':id/participate')
  @UseGuards(AuthenticationGuard)
  async participateInEvent(
    @Param('id') eventId: string,
    @GetUser() userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is missing');
    }
    return this.eventsService.participateInEvent(eventId, userId);
  }

  @Get(':id/voucher')
  @UseGuards(AuthenticationGuard)
  async getParticipationVoucher(
    @Param('id') eventId: string,
    @GetUser() userId: string,
    @Res() res: Response,
  ) {
    try {
      const pdfPath = await this.eventsService.generateParticipationVoucher(eventId, userId);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="voucher-${eventId}.pdf"`);
      
      const fileStream = createReadStream(pdfPath);
      fileStream.pipe(res);
    } catch (error) {
      throw new BadRequestException('Failed to generate voucher');
    }
  }
  @Patch(':id')
  @Permissions([{ resource: Resource.events, actions: [Action.update] }])
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(id, updateEventDto);
  }

  @Delete(':id')
  @Permissions([{ resource: Resource.events, actions: [Action.delete] }])
  async deleteEvent(@Param('id') id: string) {
    return this.eventsService.deleteEvent(id);
  }

}