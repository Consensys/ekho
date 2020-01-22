import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import ChannelDto from './dto/channel.dto';
import CreateChannelDto from './dto/create-channel.dto';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelService: ChannelsService) {}

  @Post()
  async create(@Body() channel: CreateChannelDto): Promise<number> {
    return this.channelService.create(channel);
  }

  @Get('name')
  async getByName(@Query('name') name: string): Promise<ChannelDto> {
    return this.channelService.findByName(name);
  }

  @Get()
  async getById(@Query('id') id: number): Promise<ChannelDto> {
    return this.channelService.findById(id);
  }

  @Get('test')
  async testChannel(): Promise<ChannelDto> {
    return this.channelService.test();
  }
}
