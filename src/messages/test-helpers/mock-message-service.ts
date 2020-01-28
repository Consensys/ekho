import { MessagesService } from '../messages.service';

export const mockMessagesService: jest.Mock<Omit<
  MessagesService,
  'messageRepository ipfsService web3Service eventsService'
>> = jest.fn(() => {
  return {
    sendMessage: jest.fn(),
    findAll: jest.fn(),
    findForUser: jest.fn(),
  };
});
