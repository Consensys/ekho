import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptographyModule } from './cryptography/cryptography.module';
import ipfsConfiguration from './ipfs/ipfs.configuration';
import { IpfsModule } from './ipfs/ipfs.module';
import { MessagesModule } from './messages/messages.module';
import { UsersModule } from './users/users.module';
import web3Configuration from './web3/web3.configuration';
import { Web3Module } from './web3/web3.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [ipfsConfiguration, web3Configuration],
    }),
    CryptographyModule,
    Web3Module,
    IpfsModule,
    UsersModule,
    MessagesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
