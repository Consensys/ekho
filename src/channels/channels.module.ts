import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactsModule } from 'src/contacts/contacts.module';
import { UsersModule } from 'src/users/users.module';
import { CryptographyModule } from '../cryptography/cryptography.module';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { Channel } from './entities/channels.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Channel]), CryptographyModule, UsersModule, ContactsModule],
  exports: [ChannelsService],
  providers: [ChannelsService],
  controllers: [ChannelsController],
})
export class ChannelsModule {}
