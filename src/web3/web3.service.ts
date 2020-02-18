import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transaction as Tx } from 'ethereumjs-tx';
import { bufferToHex } from 'ethereumjs-util';
import { Block } from 'src/events/entities/blocks.entity';
import Web3 from 'web3';
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
  }

  async onModuleInit(): Promise<void> {
    await this.Refresh();
  }

  async Refresh(): Promise<void> {
    Logger.debug('Polling blockchain for new log events.');
    let transactionsFound: number = 0;
    const options = {
      fromBlock: await this.eventsService.getLatestBlock(),
      address: this.contractAddress,
    };
    let lastSavedBlock: number = options.fromBlock;
    this.web3.eth
      .subscribe('logs', options, (error, result) => {
        if (error) {
          Logger.error(result);
        }
      })
      .on('data', async log => {
        const blockNumber = log.blockNumber;
        const transactionHash = log.transactionHash;

        const decoded = this.web3.eth.abi.decodeParameters(['string', 'string', 'string'], log.data);
        const channelId = Web3.utils.toUtf8(decoded[0]);
        const content = Web3.utils.toUtf8(decoded[1]);
        const signature = Web3.utils.toUtf8(decoded[2]);

        let tx = await this.eventsService.getByTransactionHash(transactionHash);
        if (!tx) {
          tx = new EkhoEvent();
        }

        const currentBlock = new Block();
        currentBlock.blockNumber = blockNumber;

        tx.txHash = transactionHash;
        tx.channelId = channelId;
        tx.content = content;
        tx.signature = signature;
        tx.status = 'mined'; // TODO: change to ENUM
        tx.block = currentBlock;
        tx.processed = false;
        // TODO: wrap these saves in a transaction
        if (blockNumber > lastSavedBlock) {
          lastSavedBlock = await this.eventsService.saveBlockInfo(currentBlock);
        }
        const dbEvent = await this.eventsService.getByTransactionHash(tx.txHash);
        if (!dbEvent) {
          Logger.debug('Saving new transaction', tx.txHash);
          await this.eventsService.save(tx);
          transactionsFound++;
        }
      })
      .on('changed', log => {
        Logger.debug(log);
      });
    Logger.debug(
      `Subscribed and retrieved ${transactionsFound} new transactions from contract ${this.contractAddress} via ${this.rpcUrl}`,
    );
  }

  async emitEvent(channelId: string, content: string, signature: string): Promise<string> {
    Logger.debug('Preparing transaction for chain');
    const txCount = await this.getTransactionCount(this.address);
    Logger.debug(`Account Nonce: ${txCount}`);
    const bufferedPrivateKey = Buffer.from(this.privateKey, 'hex');
    const contract = new this.web3.eth.Contract(Web3Constants.abi as any, this.contractAddress);

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

    const serializedTx = tx.serialize();
    const raw = '0x' + serializedTx.toString('hex');

    try {
      Logger.debug('Writing transaction to chain');
      const txHash = await this.sendSignerTransaction(raw);
      if (txHash) {
        Logger.debug('transaction successful: ', txHash);
        return txHash;
      } else {
        throw new Error('Error writing to chain');
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
