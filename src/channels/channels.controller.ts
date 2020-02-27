import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import BroadcastChannelDto from './dto/broadcastchannel.dto';
import CreateBroadcastChannelDto from './dto/create-broadcastchannel.dto';
import CreateBroadcastChannelListenerDto from './dto/create-broadcastchannellistener.dto';
import CreateChannelDto from './dto/create-channel.dto';
import EncodedMessageDto from './dto/encodedmessage.dto';
import RawMessageDto from './dto/rawmessage.dto';
import { BroadcastChannel } from './entities/broadcastchannels.entity';
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

  // creates a broadcast channel listener
  @Post('broadcast/listener')
  async createBroadcastChannelListener(@Body() channel: CreateBroadcastChannelListenerDto): Promise<Channel> {
    return this.channelService.createBroadcastChannelListener(channel);
  }

  @Post('broadcast')
  async createBroadcastChannel(@Body() channel: CreateBroadcastChannelDto): Promise<BroadcastChannelDto> {
    return this.channelService.createBroadcastChannel(channel);
  }

  @Get('broadcast')
  async findBroadcastChannels(@Query('userid') userId: number): Promise<BroadcastChannel[]> {
    return this.channelService.getBroadcastChannels(userId);
  }

  // Creates a channel message
  @Post('message')
  async createChannelMessage(@Body() channelMessage: RawMessageDto): Promise<EncodedMessageDto> {
    return this.channelService.createChannelMessage(channelMessage);
  }

  // process all received blockchain events
  @Post('refresh')
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
  @Get('member/:id')
  async findChannelMemberById(@Param('id') id: number): Promise<ChannelMember> {
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
  @Get('message/:id')
  async findChannelMessageById(@Param('id') id: number): Promise<ChannelMessage> {
    return this.channelService.findChannelMessageById(id);
  }
}
