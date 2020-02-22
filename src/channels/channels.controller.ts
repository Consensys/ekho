import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import CreateChannelDto from './dto/create-channel.dto';
import EncodedMessageDto from './dto/encodedmessage.dto';
import RawMessageDto from './dto/rawmessage.dto';
import { ChannelMember } from './entities/channelmembers.entity';
import { ChannelMessage } from './entities/channelmessages.entity';
import { Channel } from './entities/channels.entity';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelService: ChannelsService) {}

  // functional methods section

  // Creates a channel and members
  @Post()
  async createChannel(@Body() channel: CreateChannelDto): Promise<Channel> {
    return this.channelService.createChannelAndMembers(channel);
  }

  // Creates a channel message
  @Post('message')
  async createChannelMessage(@Body() channelMessage: RawMessageDto): Promise<EncodedMessageDto> {
    return this.channelService.createChannelMessage(channelMessage);
  }

  // process all received blockchain events
  @Get('refresh')
  async processAllEvents(): Promise<number> {
    return this.channelService.processAllPendingEvents();
  }

  // query methods section

  // TODO pass and filter by userid
  // Returns all channels (including channel members)
  @Get()
  async getAllChannels(): Promise<Channel[]> {
    return this.channelService.findAllChannels();
  }

  // TODO pass and filter by userid
  // Gets channel by id
  @Get()
  async findChannelById(@Query('id') id: number): Promise<Channel> {
    return this.channelService.findChannelById(id);
  }

  // TODO pass and filter by userid
  // gets channel member by id
  @Get('member')
  async findChannelMemberById(@Query('id') id: number): Promise<ChannelMember> {
    return this.channelService.findChannelMemberById(id);
  }
  // TODO pass and filter by userid
  // gets all channel members
  @Get('member')
  async findAllChannelMembers(): Promise<ChannelMember[]> {
    return this.channelService.findAllChannelMembers();
  }

  // TODO: pass in and filter by user id
  @Get('message')
  async findAllChannelMessages(): Promise<ChannelMessage[]> {
    return this.channelService.findAllChannelMessages();
  }

  // TODO pass and filter by userid
  // Retrieves a channel message by id
  @Get('message')
  async findChannelMessageById(@Query('id') id: number): Promise<ChannelMessage> {
    return this.channelService.findChannelMessageById(id);
  }
}
