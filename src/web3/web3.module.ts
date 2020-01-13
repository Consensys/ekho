import { Module } from '@nestjs/common';
import { Web3Controller } from './web3.controller';
import { Web3Service } from './web3.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Web3Transaction } from './web3.entity';
import { Web3Factory } from './web3.factory';

@Module({
  imports: [TypeOrmModule.forFeature([Web3Transaction]), ConfigModule],
  controllers: [Web3Controller],
  providers: [Web3Service, Web3Factory],
  exports: [Web3Service]
})
export class Web3Module {}
