import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CryptographyModule } from './cryptography/cryptography.module';
import configuration from './config/configuration';
import { IpfsController } from './ipfs/ipfs.controller';
import { IpfsService } from './ipfs/ipfs.service';

@Module({
  imports: [ConfigModule.forRoot({
    load: [configuration],
  }), CryptographyModule],
  controllers: [IpfsController],
  providers: [IpfsService],
})
export class AppModule {}
