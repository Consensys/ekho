import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transaction as Tx } from 'ethereumjs-tx';
import { bufferToHex } from 'ethereumjs-util';
import Web3 from 'web3';
import { EkhoEvent } from '../events/events.entity';
import { EventsService } from '../events/events.service';
import { Web3Constants } from './web3.constants';
import { Web3Factory } from './web3.factory';

@Injectable()
export class Web3Service {
  /**
   * Probably need to create a deploy contract method or check with the gurus whats the best way to deal with it.
   * For now, this was deployed in Ropsen: 0x5b821362887db76980399bf4206ba747bef7ad95
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
  private readonly web3;

  constructor(
    private readonly eventsService: EventsService,
    private readonly configService: ConfigService,
    web3Factory: Web3Factory,
  ) {
    this.chain = this.configService.get<string>('web3.chain');
    this.hardfork = this.configService.get<string>('web3.hardfork');
    this.rpcUrl = this.configService.get<string>('web3.rpcUrl');
    this.contractAddress = this.configService.get<string>('web3.contractAddress');
    this.address = this.configService.get<string>('web3.broadcastAccount.address');
    this.publicKey = this.configService.get<string>('web3.broadcastAccount.publicKey');
    this.privateKey = this.configService.get<string>('web3.broadcastAccount.privateKey');
    this.web3 = web3Factory.getWeb3(this.rpcUrl);
  }

  async onModuleInit(): Promise<void> {
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
        const transactionHash = log.transactionHash;
        Logger.debug(`Received raw event: '${JSON.stringify(log, null, 2)}'`, transactionHash);
        const decoded = this.web3.eth.abi.decodeParameters(['string', 'string', 'string'], log.data);
        const channelId = Web3.utils.toUtf8(decoded[0]);
        const content = Web3.utils.toUtf8(decoded[1]);
        const signature = Web3.utils.toUtf8(decoded[2]);
        Logger.debug(`parsed channelId='${channelId}'`, transactionHash);
        Logger.debug(`parsed   content='${content}'`, transactionHash);
        Logger.debug(`parsed signature='${signature}'`, transactionHash);
        let tx = await this.eventsService.getByTransactionHash(transactionHash);
        if (!tx) {
          tx = new EkhoEvent();
        }
        tx.txHash = transactionHash;
        tx.channelId = channelId;
        tx.content = content;
        tx.signature = signature;
        tx.status = 'confirmed';
        await this.eventsService.save(tx);
      })
      .on('changed', log => {
        Logger.debug(log);
      });
    Logger.debug(`Subcribed logs from ${this.contractAddress} via ${this.rpcUrl}`);
  }

  async emitEvent(channelId: string, content: string, signature: string): Promise<string> {
    const txCount = await this.getTransactionCount(this.address);
    Logger.debug(`TransactionCount: ${txCount}`);
    const bufferedPrivateKey = Buffer.from(this.privateKey, 'hex');
    const contract = new this.web3.eth.Contract(Web3Constants.abi, this.contractAddress);
    const data = contract.methods
      .notify(Web3.utils.fromAscii(channelId), Web3.utils.fromAscii(content), Web3.utils.fromAscii(signature))
      .encodeABI();
    const txObject = {
      nonce: this.web3.utils.toHex(txCount),
      gasLimit: this.web3.utils.toHex(800000),
      gasPrice: this.web3.utils.toHex(this.web3.utils.toWei('15', 'gwei')),
      to: this.contractAddress,
      data,
    };

    const tx = new Tx(txObject, { chain: this.chain, hardfork: this.hardfork });
    if (!(tx.validate() && bufferToHex(tx.getSenderAddress()) === this.address)) {
      // TODO: need to dig why this fails while transaction gets executed and mined successfully
      // throw Error('Invalid transaction');
    }

    tx.sign(bufferedPrivateKey);

    Logger.debug(tx);

    const serializedTx = tx.serialize();
    const raw = '0x' + serializedTx.toString('hex');

    const txHash = await this.sendSignerTransaction(raw);
    await this.eventsService.save({ txHash, status: 'pending' });
    return txHash;
  }

  async getTransactionCount(account: string) {
    return new Promise(async (resolve, reject) => {
      this.web3.eth.getTransactionCount(account, (err, txCount) => (err ? reject(`${err}`) : resolve(txCount)));
    });
  }

  async sendSignerTransaction(raw: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      this.web3.eth.sendSignedTransaction(raw, (err, txHash) => (err ? reject(`${err}`) : resolve(txHash)));
    });
  }
}
