import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EkhoEvent } from './events.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EkhoEvent)
    private readonly eventsRepository: Repository<EkhoEvent>,
  ) {}

  async getAll(): Promise<EkhoEvent[]> {
    return this.eventsRepository.find();
  }

  async getTransactionByChannelId(channelId: string): Promise<EkhoEvent> {
    return this.eventsRepository.findOne({ where: { channelId } });
  }

  async getByTransactionHash(transactionHash: string): Promise<EkhoEvent> {
    return this.eventsRepository.findOne({ txHash: transactionHash });
  }

  async save(event: EkhoEvent | { txHash: string; status: string }): Promise<void> {
    await this.eventsRepository.save(event);
  }
}
