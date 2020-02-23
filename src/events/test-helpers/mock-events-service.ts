import { EventsService } from '../events.service';

export const mockEventsService: jest.Mock<Omit<EventsService, 'eventsRepository'>> = jest.fn(() => {
  return {
    get: jest.fn(),
    getAll: jest.fn(),
    getOneById: jest.fn(),
    getTransactionByChannelId: jest.fn(),
    getByTransactionHash: jest.fn(),
    save: jest.fn(),
    getLatestBlock: jest.fn(),
    saveBlockInfo: jest.fn(),
    getFirstUnprocessedEvent: jest.fn(),
    markEventAsProcessed: jest.fn(),
  };
});
