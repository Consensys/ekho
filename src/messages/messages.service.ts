import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventsService } from '../events/events.service';
import { IpfsService } from '../ipfs/ipfs.service';
import { Web3Service } from '../web3/web3.service';
import { Message } from './messages.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly ipfsService: IpfsService,
    private readonly web3Service: Web3Service,
    private readonly eventsService: EventsService,
  ) {}

  async sendMessage(from: string, to: string, channelId: string, content: string): Promise<void> {
    const ipfsPath: string = await this.ipfsService.store({
      to,
      from,
      content,
    });
    Logger.debug(ipfsPath);
    const txHash: string = await this.web3Service.emitEvent(channelId, ipfsPath, '');
    Logger.debug(txHash);

    const message = new Message();
    message.timestamp = new Date();
    message.from = from;
    message.to = to;
    message.content = content;
    message.ipfsPath = ipfsPath;
    message.txHash = txHash;
    message.channelId = channelId;
    // TODO: need to rethink this part
    // await this.messageRepository.save(message);
  }

  async findAll(): Promise<Message[]> {
    return await this.messageRepository.find();
  }

  async findForUser(user: string, channelId: string): Promise<Message> {
    // getting messages for alice
    // calculate next channelId

    // check if message is already in the repository
    let message = await this.messageRepository.findOne({
      where: { to: user, channelId },
    });
    if (message) {
      return message;
    }

    // given message is not in the repository, check if received transactions contain the channel id
    // if not, simply return nothing
    // if yes, extract the message and save it in the repository
    const tx = await this.eventsService.getTransactionByChannelId(channelId);
    if (!tx) {
      return null;
    }

    const storedMessage = await this.ipfsService.retrieve(tx.content);
    message = new Message();
    message.from = storedMessage.from;
    message.to = storedMessage.to;
    message.content = storedMessage.content;
    message.ipfsPath = tx.content;
    message.txHash = tx.txHash;
    message.channelId = channelId;
    message.timestamp = tx.createdDate;
    await this.messageRepository.save(message);

    return this.messageRepository.findOne({ where: { channelId } });
  }
}
