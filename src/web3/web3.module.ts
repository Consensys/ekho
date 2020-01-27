import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventsModule } from '../events/events.module';
import { Web3Controller } from './web3.controller';
import { Web3Factory } from './web3.factory';
import { Web3Service } from './web3.service';

@Module({
  imports: [EventsModule],
  controllers: [Web3Controller],
  providers: [Web3Service, Web3Factory, ConfigService],
  exports: [Web3Service, ConfigService],
})
export class Web3Module {}
