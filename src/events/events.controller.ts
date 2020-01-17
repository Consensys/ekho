import { Controller, Get } from '@nestjs/common';
import { EkhoEvent } from './events.entity';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async get(): Promise<EkhoEvent[]> {
    return this.eventsService.getAll();
  }
}
