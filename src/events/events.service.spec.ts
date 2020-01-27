import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mockRepository } from '../../test/test-helpers';
import { EkhoEvent } from './events.entity';
import { EventsService } from './events.service';
import { fakeEvent } from './test-helpers/faker';

describe('EventsService', () => {
  const anonEvent = fakeEvent();

  let service: EventsService;
  let repository: Repository<EkhoEvent>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: getRepositoryToken(EkhoEvent), useClass: mockRepository }, EventsService],
    }).compile();

    repository = module.get<Repository<EkhoEvent>>(getRepositoryToken(EkhoEvent));
    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('.findAll calls events repository .find', async () => {
    jest.spyOn(repository, 'find').mockResolvedValueOnce([anonEvent]);

    const [actual] = await service.getAll();

    expect(repository.find).toBeCalledTimes(1);
    expect(actual).toBe(anonEvent);
  });

  it('.getTransactionByChannelId calls events respository .findOne with channelId', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValueOnce(anonEvent);

    const actual = await service.getTransactionByChannelId(anonEvent.channelId);

    expect(repository.findOne).toBeCalledTimes(1);
    expect(repository.findOne).lastCalledWith({ where: { channelId: anonEvent.channelId } });
    expect(actual).toBe(anonEvent);
  });

  it('.getByTransactionHash calls events respository .findOne with transactionHash', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValueOnce(anonEvent);

    const actual = await service.getByTransactionHash(anonEvent.txHash);

    expect(repository.findOne).toBeCalledTimes(1);
    expect(repository.findOne).lastCalledWith({ txHash: anonEvent.txHash });
    expect(actual).toBe(anonEvent);
  });

  it('.save calls events repository .save with either an EkhoEvent or just a txHash and status', async () => {
    jest.spyOn(repository, 'save');

    await service.save(anonEvent);

    expect(repository.save).toBeCalledTimes(1);
    expect(repository.save).lastCalledWith(anonEvent);
  });
});
