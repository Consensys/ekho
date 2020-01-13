import { Test, TestingModule } from '@nestjs/testing';
import { Web3Service } from './web3.service';
import { Web3Transaction } from './web3.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import Web3 from 'web3';
import {Web3Constants} from './web3.constants';
import { Web3Factory } from './web3.factory';

describe('Web3Service', () => {
  let service: Web3Service;
  const transactionRepository = jest.fn(() => ({
    metadata: {
      columns: [],
      relations: [],
    },
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Web3Service,
        {
          provide: getRepositoryToken(Web3Transaction),
          useValue: transactionRepository,
        },
      ConfigService, Web3Factory],
    }).compile();

    service = module.get<Web3Service>(Web3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should persist listened message', () => {
    const blockchainMessage = {
        removed: false,
        logIndex: 0,
        transactionIndex: 1,
        transactionHash: '0x10f491686c7d6fdc9932dfc3af89c67f933c2712356161ec0100c91812c98110',
        blockHash: '0xce42e63088fd54b774f6f63e2d455f7ba8ba6beef2ae2717296810912dc33ce5',
        blockNumber: 7124238,
        address: '0x685d084000deE51bEb11A32009c1CFE189f78754',
        data: '0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000043078303000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a3078373436353733373400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a3078373436353733373400000000000000000000000000000000000000000000',
        topics: [
          '0xcc0c43f8734c63f9e35eaa597a582ed47e1ff597944f4cb974defa48e712f3a7'
        ],
        id: 'log_2d5620aa'
      };
    // TBD
  });
});
