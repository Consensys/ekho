import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import Web3 from 'web3';
import { mockConfigService, mockRepository } from '../../test/test-helpers';
import { EkhoEvent } from '../events/entities/events.entity';
import { EventsService } from '../events/events.service';
import { mockEventsService } from '../events/test-helpers/mock-events-service';
import { mockWeb3Config } from './web3.configuration';
import { Web3Factory } from './web3.factory';
import { Web3Service } from './web3.service';

describe('Web3Service', () => {
  let service: Web3Service;
  let web3: Web3;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        Web3Service,
        { provide: EventsService, useValue: mockEventsService },
        { provide: ConfigService, useValue: mockConfigService(mockWeb3Config as any) },
        { provide: getRepositoryToken(EkhoEvent), useValue: mockRepository },
        Web3Factory,
      ],
    })
      .overrideProvider(Web3)
      .useValue(new Web3())
      .compile();

    service = module.get<Web3Service>(Web3Service);
    web3 = module.get(Web3);
  });

  it('web3 should be defined', () => {
    expect(web3).toBeDefined();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  xit('should persist listened message', () => {
    const blockchainMessage = {
      removed: false,
      logIndex: 0,
      transactionIndex: 1,
      transactionHash: '0x10f491686c7d6fdc9932dfc3af89c67f933c2712356161ec0100c91812c98110',
      blockHash: '0xce42e63088fd54b774f6f63e2d455f7ba8ba6beef2ae2717296810912dc33ce5',
      blockNumber: 7124238,
      address: '0x685d084000deE51bEb11A32009c1CFE189f78754',
      data:
        '0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000043078303000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a3078373436353733373400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a3078373436353733373400000000000000000000000000000000000000000000',
      topics: ['0xcc0c43f8734c63f9e35eaa597a582ed47e1ff597944f4cb974defa48e712f3a7'],
      id: 'log_2d5620aa',
    };
    Logger.debug(blockchainMessage);
  });

  it('.getTransactionCount delegates Web3.eth.getTransactionCount to get the transaction count for a given account', async done => {
    const anonAccount = '0xNoSuchAccount';
    const expected = 42;

    jest.spyOn(web3.eth, 'getTransactionCount').mockResolvedValueOnce(expected);

    try {
      const actual = await service.getTransactionCount(anonAccount);
      expect(actual).toEqual(expected);
      done();
    } catch (e) {
      expect(e).not.toBeDefined();
      done();
    }
  });

  it('.getTransactionCount delegates Web3.eth.getTransactionCount which rejects to whatever that throws', async done => {
    const anonAccount = '0xNoSuchAccount';
    const expected = new Error('whatever');

    jest.spyOn(web3.eth, 'getTransactionCount').mockRejectedValueOnce(expected);

    const actual = await service.getTransactionCount(anonAccount);
    expect(actual).toBe(expected);
    done();
  });

  it(`.sendSignerTransaction delegates to Web3.eth.sendSignedTransaction. Given string raw transaction resolves to txHash`, async done => {
    const anonRawTx = 'whatever'; // Should be of type TransactionReceipt. Cannot be bothered mocking a tx which will be ignored.
    const expected = '0xNoSuchTxHash';
    jest.spyOn(web3.eth, 'sendSignedTransaction').mockResolvedValueOnce(expected as any);

    service
      .sendSignerTransaction(anonRawTx)
      .then(actual => {
        expect(actual).toEqual(expected);
        done();
      })
      .catch(err => {
        expect(err).toBeDefined();
        done();
      });
  });

  it(`.sendSignerTransaction delegates to Web3.eth.sendSignedTransaction, which may reject to whatever that throws`, async done => {
    const anonRawTx = 'whatever'; // Should be of type TransactionReceipt. Cannot be bothered mocking a tx which will be ignored.
    const expected = new Error('whatever');
    jest.spyOn(web3.eth, 'sendSignedTransaction').mockRejectedValueOnce(expected);

    service
      .sendSignerTransaction(anonRawTx)
      .then(actual => {
        expect(actual).toEqual(expected);
        done();
      })
      .catch(err => {
        expect(err).toBeDefined();
        done();
      });
  });
});
