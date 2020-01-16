import { Test, TestingModule } from '@nestjs/testing';
import { IpfsController } from './ipfs.controller';
import { IpfsService } from './ipfs.service';

xdescribe('Ipfs Controller', () => {
  let controller: IpfsController;

  const mockIpfsService = {
    store: async (data: string) => data,
    retrieve: async (data: string) => data,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IpfsService],
      controllers: [IpfsController],
    })
      .overrideProvider(IpfsService)
      .useValue(mockIpfsService)
      .compile();

    controller = module.get<IpfsController>(IpfsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
