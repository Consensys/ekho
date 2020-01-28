import { EventsService } from '../events.service';

export const mockEventsService: jest.Mock<Omit<EventsService, 'eventsRepository'>> = jest.fn(() => {
  return {
    get: jest.fn(),
    getAll: jest.fn(),
    getTransactionByChannelId: jest.fn(),
    getByTransactionHash: jest.fn(),
    save: jest.fn(),
  };
});
