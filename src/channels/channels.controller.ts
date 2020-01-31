import { Body, Controller, Delete, Get, Post, Put, Query } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import ChannelMemberDto from './dto/channelmember.dto';
import CreateChannelDto from './dto/create-channel.dto';
import CreateChannelMemberDto from './dto/create-channelmember.dto';
import CreateChannelMessageDto from './dto/create-channelmessage.dto';
import { ChannelMember } from './entities/channelmembers.entity';
import { ChannelMessage } from './entities/channelmessages.entity';
import { Channel } from './entities/channels.entity';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelService: ChannelsService) {}

  /**
   * Creates a channel
   * @param channel channel to create
   * @returns Channel channel entity created
   */
  @Post()
  async createChannel(@Body() channel: CreateChannelDto): Promise<Channel> {
    return this.channelService.createChannel(channel);
  }

  /**
   * Deletes a channel
   * @param id channel id to delete
   */
  @Delete()
  async deleteChannel(@Query('id') id: number): Promise<void> {
    return this.channelService.deleteChannel(id);
  }

  /**
   * Gets channel by name
   * @param name channel name to retrieve
   * @returns Channel channel entity retrieved
   */
  @Get('name')
  async getChannelByName(@Query('name') name: string): Promise<Channel> {
    return this.channelService.findChannelByName(name);
  }

  /**
   * Gets channel by id
   * @param id channel id to retrieve
   * @returns Channel channel entity retrieved
   */
  @Get()
  async getChannelById(@Query('id') id: number): Promise<Channel> {
    return this.channelService.findChannelById(id);
  }

  /**
   * gets channel member by id
   * @param id channel member id to retrieve
   * @returns ChannelMember channel member entity retrieved
   */
  @Get('member')
  async getChannelMember(@Query('id') id: number): Promise<ChannelMember> {
    return this.channelService.findChannelMemberById(id);
  }

  /**
   * Creates a channel member
   * @param channelMember channel member entity to create
   * @returns ChannelMember channel member entity created
   */
  @Post('member')
  async createChannelMember(@Body() channelMember: CreateChannelMemberDto): Promise<ChannelMember> {
    return this.channelService.createChannelMember(channelMember);
  }

  /**
   * Updates a channel member
   * @param channelMember channel member to update
   * @returns ChannelMember channel member entity updated
   */
  @Put('member')
  async updateChannelMember(@Body() channelMember: ChannelMemberDto): Promise<ChannelMember> {
    return this.channelService.updateChannelMember(channelMember);
  }

  /**
   * Deletes a channel member
   * @param id channel member id to delete
   */
  @Delete('member')
  async deleteChannelMember(@Query('id') id: number): Promise<void> {
    return this.channelService.deleteChannelMember(id);
  }

  /*
  //TODO: likely better via graphql interface?
  @Get('message')
  async getChannelMessagesByChannelId(@Query('id') id: number): Promise<ChannelMessage[]> {
    return this.channelService.findAllChannelMessagesByChannelId(id);
  }
   */

  /**
   * Creates a channel message
   * @param channelMessage channel message to create
   * @returns ChannelMessaage channel message created
   */
  @Post('message')
  async createChannelMessage(@Body() channelMessage: CreateChannelMessageDto): Promise<ChannelMessage> {
    return this.channelService.createChannelMessage(channelMessage);
  }

  /**
   * Retrieves a channel message by id
   * @param id channel message id to retrieve
   * @returns ChannelMessage channel message retrieved
   */
  @Get('message')
  async getChannelMessage(@Query('id') id: number): Promise<ChannelMessage> {
    return this.channelService.findChannelMessageById(id);
  }

  /**
   * test method to create dummy test data
   * @returns Channel
   */
  @Get('test')
  async testChannel(): Promise<Channel> {
    return this.channelService.testChannelMessages();
  }
}
