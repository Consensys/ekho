import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CryptographyModule } from './cryptography/cryptography.module';
import ipfsConfiguration from './ipfs/ipfs.configuration';
import { Web3Module } from './web3/web3.module';
import { IpfsModule } from './ipfs/ipfs.module';
import web3Configuration from './web3/web3.configuration';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    load: [ipfsConfiguration, web3Configuration],
  }), CryptographyModule, Web3Module, IpfsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
