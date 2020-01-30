import { ApiProperty } from '@nestjs/swagger';
import { Contact } from 'src/contacts/contacts.entity';
import { User } from 'src/users/entities/users.entity';
import { Channel } from '../entities/channels.entity';

export default class ChannelMemberDto {
  @ApiProperty({ description: 'Channel member Id' })
  id: number;

  @ApiProperty({ description: 'Message Chain Key' })
  messageChainKey: string;

  @ApiProperty({ description: 'Channel identifier' })
  channel: Channel;

  @ApiProperty({ description: 'User identifier' })
  user: User;

  @ApiProperty({ description: 'Contact identifier' })
  contact: Contact;
}
