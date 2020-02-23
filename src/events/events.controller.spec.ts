import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mockRepository } from '../../test/test-helpers';
import { Block } from './entities/blocks.entity';
import { EkhoEvent } from './entities/events.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

describe('Events Controller', () => {
  let controller: EventsController;

  /*
  let anonEvent: EkhoEvent = {
    id: -1,
    txHash: '0x123',
    status: 'DERP',
    createdDate: new Date(0),
    channelId: 'ANON_CHANNELID',
    content: 'lalala',
    signature: 'Made in Ireland',
    block: anonBlock,
    processed: false,
  };

  let anonBlock: Block = {
    id: -1,
    blockNumber: 0,
    blockevents: [anonEvent],
  };
*/
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: getRepositoryToken(EkhoEvent), useClass: mockRepository },
        { provide: getRepositoryToken(Block), useClass: mockRepository },
        EventsService,
      ],
      controllers: [EventsController],
    }).compile();
    // const service: EventsService = module.get<EventsService>(EventsService);
    controller = module.get<EventsController>(EventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  /*
  it('calls EventsService.getAll to get events', async () => {
    jest.spyOn(service, 'getAll').mockResolvedValueOnce([anonEvent]);

    const [actual] = await controller.get();

    expect(service.getAll).toBeCalledTimes(1);
    expect(actual).toBe(anonEvent);
  });
  */
});
