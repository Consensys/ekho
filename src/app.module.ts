import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelsModule } from './channels/channels.module';
import { ContactsModule } from './contacts/contacts.module';
import { DevelopmentModule } from './development/development.module';
import ipfsConfiguration from './ipfs/ipfs.configuration';
import { MessagesModule } from './messages/messages.module';
import { UsersModule } from './users/users.module';
import vaultConfiguration from './vault/vault.configuration';
import { VaultModule } from './vault/vault.module';
import web3Configuration from './web3/web3.configuration';

@Module({
  imports: [
    GraphQLModule.forRoot({
      include: [UsersModule, ContactsModule],
      playground: true,
      autoSchemaFile: 'schema.gql',
    }),
    TypeOrmModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [ipfsConfiguration, web3Configuration, vaultConfiguration],
    }),
    UsersModule,
    MessagesModule,
    ContactsModule,
    ChannelsModule,
    DevelopmentModule,
    VaultModule,
  ],
})
export class AppModule {}
