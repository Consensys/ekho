import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from '../events/events.module';
import { IpfsModule } from '../ipfs/ipfs.module';
import { Web3Module } from '../web3/web3.module';
import { MessagesController } from './messages.controller';
import { Message } from './messages.entity';
import { MessagesService } from './messages.service';

@Module({
  imports: [TypeOrmModule.forFeature([Message]), IpfsModule, Web3Module, EventsModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
