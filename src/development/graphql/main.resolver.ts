import { Args, Parent, Query, ResolveProperty, Resolver } from '@nestjs/graphql';
import { ChannelsService } from '../../channels/channels.service';
import { ChannelMember } from '../../channels/entities/channelmembers.entity';
import { User } from '../../users/entities/users.entity';
import { UsersService } from '../../users/users.service';

@Resolver(of => User)
export class UsersResolvery {
  constructor(private readonly usersService: UsersService, private readonly channelsService: ChannelsService) {}

  @Query(returns => User)
  public async userById(@Args('id') id: number): Promise<User> {
    return this.usersService.findById(id);
  }

  @Query(returns => User)
  public async userByName(@Args('name') name: string): Promise<User> {
    return this.usersService.findByName(name);
  }

  @Query(returns => [User])
  public async Users(): Promise<User[]> {
    return this.usersService.findAll();
  }
  @ResolveProperty('channelmembers', returns => [ChannelMember])
  async getChannelMembers(@Parent() user: User) {
    const { id } = user;
    const a = await this.channelsService.findAllChannelMembersByUserId(id);
    return a;
  }
  @ResolveProperty('user', returns => User)
  async getUser(@Parent() user: User) {
    const { id } = user;
    return this.usersService.findById(id);
  }
}
