import { Test, TestingModule } from '@nestjs/testing';
import { IpfsController } from './ipfs.controller';

describe('Ipfs Controller', () => {
  let controller: IpfsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IpfsController],
    }).compile();

    controller = module.get<IpfsController>(IpfsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
