import { Injectable, Logger } from '@nestjs/common';
import Web3 from 'web3';
import { Transaction as Tx } from 'ethereumjs-tx';
import { bufferToHex } from 'ethereumjs-util';
import { ConfigService } from '@nestjs/config';

import {Web3Constants} from './web3.constants';

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

    constructor(private readonly configService: ConfigService) {
        this.chain = this.configService.get<string>('web3.chain');
        this.hardfork = this.configService.get<string>('web3.hardfork');
        this.rpcUrl = this.configService.get<string>('web3.rpcUrl');
        this.contractAddress = this.configService.get<string>('web3.contractAddress');
        this.address = this.configService.get<string>('web3.broadcastAccount.address');
        this.publicKey = this.configService.get<string>('web3.broadcastAccount.publicKey');
        this.privateKey = this.configService.get<string>('web3.broadcastAccount.privateKey');

        this.web3 = new Web3(new Web3.providers.WebsocketProvider(this.rpcUrl));
        this.initListener();
    }

    // POC - just logging event sent to this contract
    private initListener() {
        const options = {
            fromBlock: 0,
            address: this.contractAddress,
        };
        this.web3.eth.subscribe('logs', options, (error, result) => {
            if (error) {
                Logger.error(result);
            }
        }).on('data', log => {
            Logger.debug(log);
            Logger.debug(`Data received from logs: ${this.web3.utils.hexToUtf8(log.data)}`);
        }).on('changed', log => {
            Logger.debug(log);
        });
    }

    async broadcastNotification(messageUid: string): Promise<string> {
            const txCount = await this.getTransactionCount(this.address);
            Logger.debug(`TransactionCount: ${txCount}`);
            const bufferedPrivateKey = Buffer.from(this.privateKey, 'hex');
            const contract = new this.web3.eth.Contract(Web3Constants.abi, this.contractAddress);
            const data = contract.methods.notify(messageUid).encodeABI();
            const txObject = {
                nonce: this.web3.utils.toHex(txCount),
                gasLimit: this.web3.utils.toHex(800000),
                gasPrice: this.web3.utils.toHex(this.web3.utils.toWei('10', 'gwei')),
                to: this.contractAddress,
                data,
            };

            const tx = new Tx(txObject, { chain: this.chain, hardfork: this.hardfork });
            if (!(
                tx.validate() &&
                bufferToHex(tx.getSenderAddress()) === this.address
            )) {
                // TODO: need to dig why this fails while transaction gets executed and mined successfully
                // throw Error('Invalid transaction');
            }

            tx.sign(bufferedPrivateKey);

            Logger.debug(tx);

            const serializedTx = tx.serialize();
            const raw = '0x' + serializedTx.toString('hex');

            return this.sendSignerTransaction(raw);
    }

    async getTransactionCount(account: string) {
        return new Promise(async (resolve, reject) => {
            this.web3.eth.getTransactionCount(account, (err, txCount) => err ? reject(`${err}`) : resolve(txCount));
        });
    }

    async sendSignerTransaction(raw: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            this.web3.eth.sendSignedTransaction(raw, (err, txHash) => err ? reject(`${err}`) : resolve(txHash));
        });
    }
}
