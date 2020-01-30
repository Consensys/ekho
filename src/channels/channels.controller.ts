import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import ChannelDto from './dto/channel.dto';
import CreateChannelDto from './dto/create-channel.dto';
import CreateChannelMemberDto from './dto/create-channelmember.dto';
import { ChannelMember } from './entities/channelmembers.entity';
import { Channel } from './entities/channels.entity';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelService: ChannelsService) {}

  @Post()
  async createChannel(@Body() channel: CreateChannelDto): Promise<number> {
    return this.channelService.createChannel(channel);
  }

  @Get('name')
  async getChannelByName(@Query('name') name: string): Promise<Channel> {
    return this.channelService.findChannelByName(name);
  }

  @Get()
  async getChannelById(@Query('id') id: number): Promise<Channel> {
    return this.channelService.findChannelById(id);
  }

  @Get('message')
  async getChannelMessagesByChannelId(@Query('id') id: number): Promise<ChannelMember[]> {
    return this.channelService.findAllChannelMessagesByChannelId(id);
  }

  @Get('test')
  async testChannel(): Promise<ChannelDto> {
    return this.channelService.testChannelMessages();
  }

  @Post('member')
  async createChannelMember(@Body() channelMember: CreateChannelMemberDto): Promise<ChannelMember> {
    return this.channelService.createChannelMember(channelMember);
  }
}
