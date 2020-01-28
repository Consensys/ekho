import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { fakeMessage, fakeSendMessageDto } from './test-helpers/faker';
import { mockMessagesService } from './test-helpers/mock-message-service';

describe('Messages Controller', () => {
  let controller: MessagesController;
  let service: MessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [{ provide: MessagesService, useValue: mockMessagesService() }],
    }).compile();

    controller = module.get<MessagesController>(MessagesController);
    service = module.get<MessagesService>(MessagesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('sendMessage delegates MessageService.sendMessage to send a message', async () => {
    jest.spyOn(service, 'sendMessage');
    const anonSendMessageDto = fakeSendMessageDto();

    await controller.sendMessage(anonSendMessageDto);

    expect(service.sendMessage).toBeCalledTimes(1);
    expect(service.sendMessage).lastCalledWith(
      anonSendMessageDto.from,
      anonSendMessageDto.to,
      anonSendMessageDto.channelId,
      anonSendMessageDto.content,
    );
  });

  it('getAllMessages delegates MessageService.getAllMessages', async () => {
    const anonMessages = ['1', '2'].map(i => fakeMessage({ id: +i, content: `message${i}` }));
    jest.spyOn(service, 'findAll').mockResolvedValueOnce(anonMessages);

    const actual = await controller.getAllMessages();

    expect(service.findAll).toBeCalledTimes(1);
    expect(actual).toEqual(anonMessages);
  });

  it('getMessages delegates MessagesService.findForUser to return all messages for a given user', async () => {
    // TODO: Validate whether string 'user' passed to controller is a userId or what.
    const anonUserId = 'you';
    const anonMessages = ['1', '2'].map(i => fakeMessage({ id: +i, content: `message${i}` }));
    const [firstMessage, secondMessage] = anonMessages;

    jest
      .spyOn(service, 'findForUser')
      .mockResolvedValueOnce(firstMessage)
      .mockResolvedValueOnce(secondMessage)
      .mockResolvedValueOnce(null);

    const actual = await controller.getMessages(anonUserId);

    expect(service.findForUser).toBeCalledTimes(anonMessages.length + 1);
    expect(actual).toEqual(anonMessages);
  });
});
