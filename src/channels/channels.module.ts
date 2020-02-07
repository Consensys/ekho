import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from 'src/contacts/contacts.entity';
import { ContactsModule } from 'src/contacts/contacts.module';
import { IpfsModule } from 'src/ipfs/ipfs.module';
import { User } from 'src/users/entities/users.entity';
import { UsersModule } from 'src/users/users.module';
import { Web3Module } from 'src/web3/web3.module';
import { CryptographyModule } from '../cryptography/cryptography.module';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { ChannelMember } from './entities/channelmembers.entity';
import { ChannelMessage } from './entities/channelmessages.entity';
import { Channel } from './entities/channels.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Channel, ChannelMember, ChannelMessage, User, Contact]),
    CryptographyModule,
    UsersModule,
    ContactsModule,
    IpfsModule,
    Web3Module,
  ],
  exports: [ChannelsService],
  providers: [ChannelsService],
  controllers: [ChannelsController],
})
export class ChannelsModule {}
