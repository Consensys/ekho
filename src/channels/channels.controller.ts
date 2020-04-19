import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import BroadcastChannelDto from './dto/broadcastchannel.dto';
import CreateBroadcastChannelDto from './dto/create-broadcastchannel.dto';
import CreateChannelDto from './dto/create-channel.dto';
import CreateExternalChannelDto from './dto/create-externalchannel.dto';
import EncodedMessageDto from './dto/encodedmessage.dto';
import BroadcastChannelLinkDto from './dto/link-broadcastchannel.dto';
import ProcessReport from './dto/processreport.dto';
import RawMessageDto from './dto/rawmessage.dto';
import { BroadcastChannel } from './entities/broadcastchannels.entity';
import { ChannelMember } from './entities/channelmembers.entity';
import { ChannelMessage } from './entities/channelmessages.entity';
import { Channel } from './entities/channels.entity';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelService: ChannelsService) {}

  // Creates a channel and members
  @Post()
  async createChannel(@Body() channel: CreateChannelDto): Promise<Channel> {
    return this.channelService.createChannelAndMembers(channel);
  }

  // Creates a channel to an externally-created contact (secret generated outside ekho)
  @Post('integration')
  async createExternalChannelAndMembers(@Body() channel: CreateExternalChannelDto): Promise<Channel> {
    return this.channelService.createExternalChannelAndMembers(channel);
  }

  // Creates a channel message
  @Post('message')
  async createChannelMessage(@Body() channelMessage: RawMessageDto): Promise<EncodedMessageDto> {
    return this.channelService.createChannelMessage(channelMessage);
  }

  @Get('refresh')
  async processEvents(@Query('userId') userId: number): Promise<ProcessReport> {
    return this.channelService.process(userId);
  }

  @Post('broadcast/follow/:userId')
  async followBroadcast(@Param('userId') userId: number, @Body() channel: BroadcastChannelLinkDto): Promise<Channel> {
    return this.channelService.followBroadcast(userId, channel);
  }

  @ApiQuery({ name: 'userId', required: true })
  @ApiQuery({ name: 'channelId', required: true })
  @Get('broadcast/share')
  async getBroadcastChannelLink(
    @Query('userId') userId: number,
    @Query('channelId') channelId: number,
  ): Promise<BroadcastChannelLinkDto> {
    const link = this.channelService.getBroadcastChannelLink(userId, channelId);
    return link;
  }

  @Post('broadcast')
  async createBroadcastChannel(@Body() channel: CreateBroadcastChannelDto): Promise<BroadcastChannelDto> {
    return this.channelService.createBroadcastChannel(channel);
  }

  @ApiQuery({ name: 'userId', required: true })
  @Get('broadcast')
  async findBroadcastChannels(@Query('userId') userId: number): Promise<BroadcastChannel[]> {
    return this.channelService.getBroadcastChannels(userId);
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

  // Retrieves a channel messages
  /**
   * Retrieves channel messages. Supports query filters. No filters will return all messages
   * @param userId filter to only return messages sent by user ID
   * @param contactId filter to return only return messages received from contact ID
   */
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'contactId', required: false })
  @Get('message')
  async findChannelMessage(
    @Query('userId') userId?: number,
    @Query('contactId') contactId?: number,
  ): Promise<ChannelMessage[]> {
    if (userId && contactId) {
      throw Error('Only one filter can be specified');
    }
    if (userId) {
      return this.channelService.findChannelMessageByUserId(contactId);
    }
    if (contactId) {
      return this.channelService.findChannelMessageByContactId(contactId);
    }
    return this.channelService.findAllChannelMessages();
  }
}
