import { Controller, Get, Put, Query } from '@nestjs/common';
import EkhoEventDto from './dto/ekhoevent.dto';
import { EkhoEvent } from './entities/events.entity';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async get(): Promise<EkhoEvent[]> {
    return this.eventsService.getAll();
  }

  @Get()
  async getById(@Query('id') id: number): Promise<EkhoEvent> {
    return this.eventsService.getOneById(id);
  }

  @Get('block')
  async getLatestBlockNumber(): Promise<number> {
    return this.eventsService.getLatestBlock();
  }

  @Put()
  async markEventAsProcessed(@Query('id') id: number): Promise<boolean> {
    return this.eventsService.markEventAsProcessed(id);
  }

  @Get('unprocessed')
  async processBlockchainEvents(): Promise<EkhoEventDto> {
    return this.eventsService.getFirstUnprocessedEvent();
  }
}
