import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EkhoEvent } from './events.entity';
import { EventsService } from './events.service';

@Module({
  imports: [TypeOrmModule.forFeature([EkhoEvent])],
  providers: [EventsService],
  controllers: [EventsController],
  exports: [EventsService],
})
export class EventsModule {}
