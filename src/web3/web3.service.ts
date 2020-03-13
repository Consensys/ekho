import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transaction as Tx } from 'ethereumjs-tx';
import { bufferToHex } from 'ethereumjs-util';
import Web3 from 'web3';
import EkhoEventDto from '../events/dto/ekhoevent.dto';
import { EkhoEvent } from '../events/entities/events.entity';
import { EventsService } from '../events/events.service';
import { Web3Constants } from './web3.constants';

@Injectable()
export class Web3Service {
  /**
   * Probably need to create a deploy contract method or check with the gurus whats the best way to deal with it.
   * For now, this was deployed in Ropsten: 0x5b821362887db76980399bf4206ba747bef7ad95
   *
   *   pragma solidity >=0.4.22 <0.6.0;
   *   contract MessageNotifier {
   *
   *       event NotifyNewMessage(string messageUid);
   *
   *       function notify(string memory messageUid) public {
   *           emit NotifyNewMessage(messageUid);
   *       }
   *   }
   */

  // TODO - checkout with the gurus how ABI should be stored and other good practices as this has been completly hammered out

  private readonly chain;
  private readonly hardfork;
  private readonly rpcUrl;
  private readonly contractAddress;
  private readonly address;
  private readonly privateKey;
  private readonly publicKey;
  private readonly gasPrice;
  private readonly BASE_64 = 'base64';
  private readonly HEX_ENCODING = 'hex';
  private readonly BYTES = 'bytes';
  private readonly CHANNEL_ID_BYTES = 8;
  private readonly SIGNATURE_BYTES = 64;

  constructor(
    private readonly eventsService: EventsService,
    private readonly configService: ConfigService,
    private readonly web3: Web3,
  ) {
    this.chain = this.configService.get<string>('web3.chain');
    this.hardfork = this.configService.get<string>('web3.hardfork');
    this.rpcUrl = this.configService.get<string>('web3.rpcUrl');
    this.contractAddress = this.configService.get<string>('web3.contractAddress');
    this.address = this.configService.get<string>('web3.broadcastAccount.address');
    this.publicKey = this.configService.get<string>('web3.broadcastAccount.publicKey');
    this.privateKey = this.configService.get<string>('web3.broadcastAccount.privateKey');
    this.gasPrice = this.configService.get<string>('web3.broadcastAccount.gasPrice');
  }

  async onModuleInit(): Promise<void> {
    await this.Refresh();
  }

  async Refresh(): Promise<void> {
    Logger.debug('eventlog subscriber: polling blockchain for new log events.');
    let transactionsFound: number = 0;

    const options = {
      fromBlock: 0,
      address: this.contractAddress,
    };

    this.web3.eth
      .subscribe('logs', options, (error, result) => {
        if (error) {
          Logger.error(result);
        }
      })
      .on('data', async log => {
        Logger.debug('eventlog subscriber: new blockchain event found');
        const blockNumber = log.blockNumber;
        const transactionHash = log.transactionHash;

        const decoded = this.web3.eth.abi.decodeParameters([this.BYTES], log.data);
        const ekho = Buffer.from(decoded[0].slice(2), this.HEX_ENCODING);
        const event = await this.createEventFromEkho(ekho);

        let tx = await this.eventsService.getByTransactionHash(transactionHash);
        if (!tx) {
          tx = new EkhoEvent();
        }

        tx.channelId = event.channelIdentifier;
        tx.content = event.encryptedMessageLink;
        tx.signature = event.encryptedMessageLinkSignature;
        tx.txHash = transactionHash;
        tx.status = 'mined'; // TODO: change to ENUM
        tx.block = blockNumber;
        tx.processed = false;

        const dbEvent = await this.eventsService.getByTransactionHash(tx.txHash);
        if (!dbEvent) {
          Logger.debug('eventlog subscriber: saving new event to db', tx.txHash);
          await this.eventsService.save(tx);
          transactionsFound++;
        }
      })
      .on('changed', log => {
        Logger.debug(log);
      });
    Logger.debug(
      `eventlog subscriber: subscribed and retrieved ${transactionsFound} new transactions from contract ${this.contractAddress} via ${this.rpcUrl}`,
    );
  }

  async generateStringContractData(channelId: string, content: string, signature: string): Promise<any> {
    const contract = new this.web3.eth.Contract(Web3Constants.abi as any, this.contractAddress);

    const data = contract.methods
      .notify(Web3.utils.fromAscii(channelId), Web3.utils.fromAscii(content), Web3.utils.fromAscii(signature))
      .encodeABI();

    return data;
  }

  // creates the binary data to store on-chain from an ekho event dto
  async createEkhoFromEvent(event: EkhoEventDto): Promise<Buffer> {
    const temp: Buffer[] = [];

    temp[0] = Buffer.from(event.channelIdentifier, this.BASE_64);
    temp[1] = Buffer.from(event.encryptedMessageLink, this.BASE_64);
    temp[2] = Buffer.from(event.encryptedMessageLinkSignature, this.BASE_64);
    const ekho: Buffer = Buffer.concat(temp);

    return ekho;
  }

  // creates an ekho event dto from the binary data stored on chain
  async createEventFromEkho(ekho: Buffer): Promise<EkhoEventDto> {
    const event = new EkhoEventDto();

    event.channelIdentifier = Buffer.from(ekho.slice(0, this.CHANNEL_ID_BYTES)).toString(this.BASE_64);
    event.encryptedMessageLink = Buffer.from(
      ekho.slice(this.CHANNEL_ID_BYTES, ekho.length - this.SIGNATURE_BYTES),
    ).toString(this.BASE_64);
    event.encryptedMessageLinkSignature = Buffer.from(
      ekho.slice(ekho.length - this.SIGNATURE_BYTES, ekho.length),
    ).toString(this.BASE_64);

    return event;
  }

  async emitEkho(event?: EkhoEventDto): Promise<string> {
    Logger.debug('... getting nonce');
    const txCount = await this.getTransactionCount(this.address);
    Logger.debug(`nonce: ${txCount}`);

    const bufferedPrivateKey = Buffer.from(this.privateKey, this.HEX_ENCODING);

    const contract = new this.web3.eth.Contract(Web3Constants.abi as any, this.contractAddress);

    let ekho: Buffer;

    // create random data if we haven't received an event
    if (event) {
      ekho = await this.createEkhoFromEvent(event);
    } else {
      Logger.debug('emitting random data');
      ekho = require('crypto').randomBytes(118); // TODO: use cryptomodule for this
    }

    const data = contract.methods.broadcast(ekho).encodeABI();

    const txObject = {
      nonce: this.web3.utils.toHex(txCount),
      gasLimit: this.web3.utils.toHex(800000),
      gasPrice: this.web3.utils.toHex(this.web3.utils.toWei(this.gasPrice, 'gwei')),
      to: this.contractAddress,
      data,
    };

    const tx = new Tx(txObject, { chain: this.chain, hardfork: this.hardfork });
    if (!(tx.validate() && bufferToHex(tx.getSenderAddress()) === this.address)) {
      // TODO: need to dig why this fails while transaction gets executed and mined successfully
      // throw Error('Invalid transaction');
    }
    tx.sign(bufferedPrivateKey);

    const serializedTx = tx.serialize();
    const raw = '0x' + serializedTx.toString(this.HEX_ENCODING);
    let txHash: any;
    try {
      Logger.debug('broadcasting transaction to chain');

      // squishing any unhandled promise exceptions...
      // so many try catches to cope with web3...
      try {
        txHash = await this.web3.eth.sendSignedTransaction(raw).catch(err => {
          Logger.debug('shhhh');
        });
      } catch (e) {
        Logger.debug('no, really, shhhh');
      }

      if (txHash) {
        Logger.debug('...transaction mined on chain: ', txHash.transactionHash);
        return txHash.transactionHash;
      } else {
        throw new Error('error writing to chain');
      }
    } catch (e) {
      Logger.debug('transaction failed: ', (e as Error).message);
      throw e;
    }
  }

  async getTransactionCount(account: string): Promise<number> {
    try {
      const txCount = await this.web3.eth.getTransactionCount(account);
      return txCount;
    } catch (e) {
      return e;
    }
    // return new Promise(async (resolve, reject) => {
    //   this.web3.eth.getTransactionCount(account, (err, txCount) => (err ? reject(`${err}`) : resolve(txCount)));
    // });
  }

  async sendSignerTransaction(raw: string): Promise<string> {
    try {
      const txHash = await this.web3.eth.sendSignedTransaction(raw);
      return txHash.transactionHash;
    } catch (e) {
      throw e;
    }
    // return new Promise(async (resolve, reject) => {
    //   this.web3.eth.sendSignedTransaction(raw, (err, txHash) => (err ? reject(`${err}`) : resolve(txHash)));
    // });
  }
}
