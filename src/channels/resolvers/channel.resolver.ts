import { Resolver } from '@nestjs/graphql';
import { FieldResolver, Root } from 'type-graphql';
import { ChannelsService } from '../channels.service';
import { ChannelMember } from '../entities/channelmembers.entity';
import { Channel } from '../entities/channels.entity';

@Resolver(of => Channel)
export class ChannelResolver {
  constructor(private readonly channelService: ChannelsService) {}

  // @Mutation(returns => ID)
  // public async createChannel(@Args('data') channel: Channel): Promise<number> {
  //   return this.channelService.createChannel(channel);
  // }

  // @Query(returns => Channel)
  // public async channel(@Args('data') channel: Channel): Promise<Channel> {
  //   return this.channelService.findOneChannel({ where: channel })
  // }

  @FieldResolver(returns => [ChannelMember])
  async channelmembers(@Root() channel: Channel): Promise<ChannelMember[]> {
    return this.channelService.findAllChannelMembersByChannelId(channel.id);
  }
}
