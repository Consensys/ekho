import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from 'src/events/events.service';
import { IpfsService } from 'src/ipfs/ipfs.service';
import { Web3Service } from 'src/web3/web3.service';
import { EventsModule } from '../events/events.module';
import { IpfsModule } from '../ipfs/ipfs.module';
import { Web3Module } from '../web3/web3.module';
import { Message } from './entities/messages.entity';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [TypeOrmModule.forFeature([Message]), IpfsModule, Web3Module, EventsModule],
  controllers: [MessagesController],
  providers: [MessagesService, ConfigService, IpfsService, EventsService, Web3Service],
  exports: [MessagesService],
})
export class MessagesModule {}
