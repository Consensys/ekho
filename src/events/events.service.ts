import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getRepository, Repository } from 'typeorm';
import EkhoEventDto from './dto/ekhoevent.dto';
import { EkhoEvent } from './entities/events.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EkhoEvent)
    private readonly eventsRepository: Repository<EkhoEvent>,
  ) {}

  async getAll(): Promise<EkhoEvent[]> {
    return this.eventsRepository.find();
  }

  async getOneById(id: number): Promise<EkhoEvent> {
    return this.eventsRepository.findOneOrFail({ id });
  }

  async getTransactionByChannelId(channelId: string): Promise<EkhoEvent> {
    return this.eventsRepository.findOne({ where: { channelId } });
  }

  async getByTransactionHash(transactionHash: string): Promise<EkhoEvent> {
    const ekhoEvent: EkhoEvent = await this.eventsRepository.findOne({ txHash: transactionHash });
    return ekhoEvent;
  }

  async save(event: EkhoEvent | { txHash: string; status: string }): Promise<void> {
    await this.eventsRepository.save(event);
  }

  async getLatestBlock(): Promise<number> {
    const cachedBlocks = await getRepository(EkhoEvent)
      .createQueryBuilder('Block')
      .select('MAX("block")', 'max')
      .getRawOne();

    if (!cachedBlocks.max) {
      cachedBlocks.max = 0;
    }
    return cachedBlocks.max;
  }

  async markEventAsProcessed(id: number): Promise<boolean> {
    Logger.debug('marking event as processed.  id: ', id.toString());

    const myEvent = await this.getOneById(id);
    myEvent.processed = true;
    await this.save(myEvent);
    return true;
  }

  async getFirstUnprocessedEvent(): Promise<EkhoEventDto> {
    Logger.debug('looking for unprocessed blockchain event.');

    const firstUnprocessedEvent = await getRepository(EkhoEvent)
      .createQueryBuilder('EkhoEvent')
      .select('MIN(EkhoEvent.id)', 'id')
      .addSelect(['EkhoEvent.channelId, EkhoEvent.content, EkhoEvent.signature'])
      .groupBy('EkhoEvent.id')
      .where('EkhoEvent.processed = false')
      .orderBy('EkhoEvent.id', 'ASC')
      .getRawOne();

    if (!firstUnprocessedEvent) {
      return null;
    } else {
      Logger.debug('one event found, eventid: ', firstUnprocessedEvent.id);
      const newEvent = new EkhoEventDto();
      newEvent.eventIdentifier = firstUnprocessedEvent.id;
      newEvent.channelIdentifier = firstUnprocessedEvent.channelId;
      newEvent.encryptedMessageLink = firstUnprocessedEvent.content;
      newEvent.encryptedMessageLinkSignature = firstUnprocessedEvent.signature;

      return newEvent;
    }
  }
}
