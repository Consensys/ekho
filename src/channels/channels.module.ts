import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from '../contacts/contacts.entity';
import { ContactsModule } from '../contacts/contacts.module';
import { CryptographyModule } from '../cryptography/cryptography.module';
import { EventsModule } from '../events/events.module';
import { IpfsModule } from '../ipfs/ipfs.module';
import { KeyManagerModule } from '../key-manager/key-manager.module';
import { User } from '../users/entities/users.entity';
import { UsersModule } from '../users/users.module';
import { Web3Module } from '../web3/web3.module';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { BroadcastChannel } from './entities/broadcastchannels.entity';
import { ChannelMember } from './entities/channelmembers.entity';
import { ChannelMessage } from './entities/channelmessages.entity';
import { Channel } from './entities/channels.entity';
import { ChannelResolver } from './resolvers/channel.resolver';
import { ChannelMembersResolver } from './resolvers/channelmembers.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([BroadcastChannel, Channel, ChannelMember, ChannelMessage, User, Contact]),
    CryptographyModule,
    UsersModule,
    ContactsModule,
    IpfsModule,
    Web3Module,
    EventsModule,
    KeyManagerModule,
  ],
  exports: [ChannelsService],
  providers: [ChannelsService, ChannelResolver, ChannelMembersResolver],
  controllers: [ChannelsController],
})
export class ChannelsModule {}
