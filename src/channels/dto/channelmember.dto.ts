import { ApiProperty } from '@nestjs/swagger';
import { Field, ID, InputType } from 'type-graphql';
import { Contact } from '../../contacts/contacts.entity';
import { User } from '../../users/entities/users.entity';
import { Channel } from '../entities/channels.entity';

@InputType()
export default class ChannelMemberDto {
  @Field(type => ID)
  @ApiProperty({ description: 'Channel member Id' })
  id: number;

  @Field()
  @ApiProperty({ description: 'Message Chain Key' })
  messageChainKey: string;

  @ApiProperty({ description: 'Channel identifier' })
  channel: Channel;

  @Field(type => User)
  @ApiProperty({ description: 'User identifier' })
  user: User;

  @Field(type => Contact)
  @ApiProperty({ description: 'Contact identifier' })
  contact: Contact;
}
