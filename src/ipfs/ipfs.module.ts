import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import IpfsClient from 'ipfs-http-client';
import { ipfsClientFactory } from './ipfs.client.factory';
import { IpfsController } from './ipfs.controller';
import { IpfsService } from './ipfs.service';

@Module({
  imports: [ConfigModule, IpfsClient],
  providers: [ipfsClientFactory],
  controllers: [IpfsController],
  exports: [IpfsService],
})
export class IpfsModule {}
