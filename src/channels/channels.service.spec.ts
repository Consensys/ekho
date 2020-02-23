import { Test, TestingModule } from '@nestjs/testing';
import { ContactsService } from '../contacts/contacts.service';
import { mockContactsService } from '../contacts/test-helpers/mock-contacts-service';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';

xdescribe('ChannelsService', () => {
  let service: ChannelsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChannelsController],
      providers: [ChannelsService, { provide: ContactsService, useValue: mockContactsService() }],
    }).compile();

    service = module.get<ChannelsService>(ChannelsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
