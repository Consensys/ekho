import { IpfsService } from '../ipfs.service';

export const mockIpfsService: jest.Mock<Omit<IpfsService, 'ipfs'>> = jest.fn(() => {
  return {
    retrieve: jest.fn(),
    store: jest.fn(),
  };
});
