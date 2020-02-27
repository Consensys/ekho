import { ApiProperty } from '@nestjs/swagger';
import { Contact } from 'src/contacts/contacts.entity';
import { User } from 'src/users/entities/users.entity';
import { Field, ID, InputType } from 'type-graphql';
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
