import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactsModule } from './contacts/contacts.module';
import ipfsConfiguration from './ipfs/ipfs.configuration';
import { MessagesModule } from './messages/messages.module';
import { UsersModule } from './users/users.module';
import web3Configuration from './web3/web3.configuration';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [ipfsConfiguration, web3Configuration],
    }),
    UsersModule,
    MessagesModule,
    ContactsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
