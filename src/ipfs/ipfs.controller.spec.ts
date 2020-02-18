import { Test, TestingModule } from '@nestjs/testing';
import { IpfsMessageDto } from './dto/ipfs-message.dto';
import { IpfsController } from './ipfs.controller';
import { IpfsService } from './ipfs.service';

describe('Ipfs Controller', () => {
  let controller: IpfsController;
  let service: IpfsService;

  const mockPath = 'https://127.0.0.1:8080/no-such-path';
  const mockIpfsContent: IpfsMessageDto = { content: 'foo' };

  const mockIpfsService = () => ({
    store: jest.fn(async (message: IpfsMessageDto) => mockPath),
    retrieve: jest.fn(async (path: string) => mockIpfsContent),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: IpfsService, useFactory: mockIpfsService }],
      controllers: [IpfsController],
    }).compile();

    service = module.get<IpfsService>(IpfsService);
    controller = module.get<IpfsController>(IpfsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('GET receives a string path and delegates IpfsService.retrieve to return an IpfsMessage of the content of that path', async () => {
    const actual = await controller.get(mockPath);

    expect(service.retrieve).toBeCalledTimes(1);
    expect(service.retrieve).lastCalledWith(mockPath);
    expect(actual).toMatchObject(mockIpfsContent);
  });

  it('POST takes an IpfsMessage and delegates IpfsService.store to return the string of the path to that message stored on Ipfs', async () => {
    const actual = await controller.post(mockIpfsContent);

    expect(service.store).toBeCalledTimes(1);
    expect(service.store).lastCalledWith(mockIpfsContent);
    expect(actual).toEqual(mockPath);
  });
});
