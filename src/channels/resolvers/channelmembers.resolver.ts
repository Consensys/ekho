import { Resolver } from '@nestjs/graphql';
import { FieldResolver, Root } from 'type-graphql';
import { Contact } from '../../contacts/contacts.entity';
import { User } from '../../users/entities/users.entity';
import { ChannelsService } from '../channels.service';
import { ChannelMember } from '../entities/channelmembers.entity';

@Resolver(of => ChannelMember)
export class ChannelMembersResolver {
  constructor(private readonly channelService: ChannelsService) {}

  @FieldResolver(returns => [ChannelMember])
  public async users(@Root() user: User): Promise<ChannelMember[]> {
    return this.channelService.findAllChannelMembersByUserId(user.id);
  }

  @FieldResolver(returns => [ChannelMember])
  public async UserChannelMemberships(@Root() user: User): Promise<ChannelMember[]> {
    return this.channelService.findAllChannelMembersByUserId(user.id);
  }

  @FieldResolver(returns => [ChannelMember])
  public async ContactChannelMemberships(@Root() contact: Contact): Promise<ChannelMember[]> {
    return this.channelService.findAllChannelMembersByContactId(contact.id);
  }
}
