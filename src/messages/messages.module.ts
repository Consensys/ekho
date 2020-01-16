import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { IpfsModule } from '../ipfs/ipfs.module';
import { Web3Module } from '../web3/web3.module';
import { Message } from './messages.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Message]), IpfsModule, Web3Module],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
