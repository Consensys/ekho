import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mockRepository } from '../../test/test-helpers';
import { EkhoEvent } from '../events/entities/events.entity';
import { EventsService } from '../events/events.service';
import { fakeEvent } from '../events/test-helpers/faker';
import { mockEventsService } from '../events/test-helpers/mock-events-service';
import { IpfsService } from '../ipfs/ipfs.service';
import { fakeIpfsMessage } from '../ipfs/test-helpers/faker';
import { mockIpfsService } from '../ipfs/test-helpers/mock-ipfs-service';
import { mockWeb3Service } from '../web3/test-helpers/mock-web3';
import { Web3Service } from '../web3/web3.service';
import { Message } from './entities/messages.entity';
import { MessagesService } from './messages.service';
import { fakeMessage } from './test-helpers/faker';

describe('MessagesService', () => {
  let service: MessagesService;
  let repo: Repository<Message>;
  let ipfsService: IpfsService;
  let eventsService: EventsService;
  let web3Service: Web3Service;

  const from = 'me';
  const to = 'you';
  const channelId = 'no-such-channel';
  const content = 'mind your business';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        MessagesService,
        { provide: getRepositoryToken(Message), useClass: mockRepository },
        { provide: IpfsService, useValue: mockIpfsService() },
        { provide: EventsService, useValue: mockEventsService() },
        { provide: Web3Service, useValue: mockWeb3Service() },
        ConfigService,
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    repo = module.get<Repository<Message>>(getRepositoryToken(Message));
    ipfsService = module.get<IpfsService>(IpfsService);
    eventsService = module.get<EventsService>(EventsService);
    web3Service = module.get<Web3Service>(Web3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('ipfsService should be defined', () => {
    expect(ipfsService).toBeDefined();
    expect(ipfsService).toHaveProperty('store');
    expect(ipfsService).toHaveProperty('retrieve');
  });

  it('web3Service should be defined', () => {
    expect(web3Service).toBeDefined();
    expect(web3Service).toHaveProperty('emitEvent');
  });

  it(`send message:
  Given: string values from and to [assume local db identifiers?], a channelId and some content
  - delegates to ipfs service to store a message, of type IpfsMessageDto, receiving the path to that stored message
  - delegates to web3 service to emit an event with the channelId and that path, receiving a transaction hash
  - stores a new Message with all the above values to Message repository`, async () => {
    const anonIpfsPath = 'no-such-path';
    const anonTxHash = '0xffffff7f';

    jest.spyOn(ipfsService, 'store').mockResolvedValueOnce(anonIpfsPath);
    jest.spyOn(web3Service, 'emitEvent').mockResolvedValueOnce(anonTxHash);

    await service.sendMessage(from, to, channelId, content);

    expect(ipfsService.store).toBeCalledTimes(1);
    expect(ipfsService.store).lastCalledWith({ content });
    // expect(ipfsService.store).lastReturnedWith(anonIpfsPath);

    expect(web3Service.emitEvent).toBeCalledTimes(1);
    expect(web3Service.emitEvent).lastCalledWith(channelId, anonIpfsPath, '');
    // expect(web3Service).lastReturnedWith(anonTxHash);

    // TODO - when Message committed to repo:
    // expect service to call repo.save with a new message of the above values.
  });

  it('findAll delegates MessageRepository to return all messages', async () => {
    const mockMessages: Message[] = [fakeMessage({ id: 0 }), fakeMessage({ id: 1 })];

    jest.spyOn(repo, 'find').mockResolvedValueOnce(mockMessages);

    const actual = await service.findAll();

    expect(repo.find).toBeCalledTimes(1);
    expect(actual).toBe(mockMessages);
  });

  it('findForUser retrives the first message for given user from the Message repository, should it be present', async () => {
    // Case where message already retrieved and on local repo:
    const mockMessage: Message = fakeMessage({ id: 0 });
    jest.spyOn(repo, 'findOne').mockResolvedValueOnce(mockMessage);

    const expectStoredMessage = await service.findForUser('anon-user', 'no-such-channel');

    expect(repo.findOne).toBeCalledTimes(1);
    expect(expectStoredMessage).toBe(mockMessage);
  });

  it(`If such an events exists, delegates IpfsService to retrieve the event and store content as a Message`, async () => {
    // Case where message not stored locally, but there is a tx:
    const mockEkhoEvent: EkhoEvent = fakeEvent({ channelId: 'no-such-channel' });
    const mockIpfsMessage = fakeIpfsMessage({ content: mockEkhoEvent.content });
    const mockMessage = fakeMessage({ ...mockEkhoEvent, ...mockIpfsMessage });

    jest
      .spyOn(repo, 'findOne')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockMessage);
    jest.spyOn(eventsService, 'getTransactionByChannelId').mockResolvedValueOnce(mockEkhoEvent);
    jest.spyOn(ipfsService, 'retrieve').mockResolvedValueOnce(mockIpfsMessage);

    const expectMessageOnIpfs = await service.findForUser('anon-user', 'no-such-channel');

    expect(repo.findOne).toBeCalledTimes(2);
    expect(eventsService.getTransactionByChannelId).toBeCalledTimes(1);
    expect(ipfsService.retrieve).toBeCalledTimes(1);
    expect(expectMessageOnIpfs).toBe(mockMessage);
  });

  it('If there is no such message on the local db, and no event, there is no message. findForUser returns null', async () => {
    // Case where message is not on local repo, and no transaction for this channel exists:
    jest.spyOn(repo, 'findOne').mockResolvedValueOnce(null);
    jest.spyOn(eventsService, 'getTransactionByChannelId').mockResolvedValueOnce(null);

    const expectNoMessage = await service.findForUser('anon-user', 'no-such-channel');
    expect(expectNoMessage).toBeNull();
  });
});
