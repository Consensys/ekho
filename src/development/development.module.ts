import { Module } from '@nestjs/common';
import { ChannelsModule } from '../channels/channels.module';
import { ContactsModule } from '../contacts/contacts.module';
import { CryptographyModule } from '../cryptography/cryptography.module';
import { KeyManagerModule } from '../key-manager/key-manager.module';
import { UsersModule } from '../users/users.module';
import { DevelopmentController } from './development.controller';
import { UsersResolvery } from './graphql/main.resolver';

@Module({
  imports: [CryptographyModule, ChannelsModule, ContactsModule, UsersModule, KeyManagerModule],
  controllers: [DevelopmentController],
  providers: [UsersResolvery],
})
export class DevelopmentModule {}
