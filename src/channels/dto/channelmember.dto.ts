import { ApiProperty } from '@nestjs/swagger';
import { Contact } from 'src/users/entities/contacts.entity';
import { User } from 'src/users/entities/users.entity';
import { Channel } from '../entities/channels.entity';

export default class ChannelMemberDto {
  @ApiProperty({ description: 'Channel member Id' })
  id: number;

  @ApiProperty({ description: 'Message Chain Key' })
  messageChainKey: Buffer;

  @ApiProperty({ description: 'Nonce' })
  nonce: number;

  @ApiProperty({ description: 'Channel identifier' })
  channel: Channel;

  @ApiProperty({ description: 'User identifier' })
  user: User;

  @ApiProperty({ description: 'Contact identifier' })
  contact: Contact;
}
