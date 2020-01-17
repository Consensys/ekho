import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from '../events/events.module';
import { Web3Controller } from './web3.controller';
import { Web3Factory } from './web3.factory';
import { Web3Service } from './web3.service';

@Module({
  imports: [ConfigModule, EventsModule],
  controllers: [Web3Controller],
  providers: [Web3Service, Web3Factory],
  exports: [Web3Service],
})
export class Web3Module {}
