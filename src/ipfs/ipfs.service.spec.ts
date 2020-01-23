import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import IpfsClient from 'ipfs-http-client';
import { mockConfigService, mockIpfsClient } from '../../test/test-helpers';
import { IpfsMessageDto } from './dto/ipfs-message.dto';
import { IpfsService } from './ipfs.service';

describe('IpfsService', () => {
  let service: IpfsService;
  let config: ConfigService;
  let client: IpfsClient;

  const mockIpfsConfigValues = { ipfs: { host: '127.0.0.1', port: '8080' } };
  const mockIpfsContent = { from: 'from', to: 'to', content: 'foo' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IpfsService,
        { provide: ConfigService, useValue: mockConfigService(mockIpfsConfigValues) },
        { provide: IpfsClient, useValue: mockIpfsClient() },
      ],
    }).compile();

    service = module.get<IpfsService>(IpfsService);
    config = module.get<ConfigService>(ConfigService);
    client = module.get<IpfsClient>(IpfsClient);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('retrieve takes an ipfs path and returns a message with the content at that path', async () => {
    const path = config.get('ipfs.host') + ':' + config.get('ipfs.port');
    client.get.mockResolvedValueOnce([{ content: JSON.stringify(mockIpfsContent) }]);

    const actual: IpfsMessageDto = await service.retrieve(path);

    expect(client.get).toBeCalledTimes(1);
    expect(client.get).lastCalledWith(path);
    expect(actual).toMatchObject(mockIpfsContent);
  });

  it('store takes an Ipfs message and delegates the addition of that message to IpfsClient. Returns string to storage address.', async () => {
    const path = config.get('ipfs.host') + ':' + config.get('ipfs.port');
    client.add.mockResolvedValueOnce([{ path }]);

    const actual = await service.store(mockIpfsContent);

    expect(client.add).toBeCalledTimes(1);
    expect(client.add).lastCalledWith(Buffer.from(JSON.stringify(mockIpfsContent), 'utf8'));

    expect(actual).toEqual(path);
  });
});
