import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ipfsClientFactory } from './ipfs.client.factory';
import { IpfsController } from './ipfs.controller';
import { IpfsService } from './ipfs.service';

@Module({
  // imports: [IpfsClient],
  providers: [ipfsClientFactory, IpfsService, ConfigService],
  controllers: [IpfsController],
  exports: [IpfsService],
})
export class IpfsModule {}
