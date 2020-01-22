import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptographyModule } from '../cryptography/cryptography.module';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { Channel } from './entities/channels.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Channel]), CryptographyModule],
  providers: [ChannelsService],
  controllers: [ChannelsController],
})
export class ChannelsModule {}
