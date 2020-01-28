import { ApiProperty } from '@nestjs/swagger';

export default class CreateChannelMemberDto {
  @ApiProperty({ description: 'Message Chain Key' })
  messageChainKey: string;

  @ApiProperty({ description: 'Nonce' })
  nonce: number;

  @ApiProperty({ description: 'Channel identifier' })
  channelId: number;

  @ApiProperty({ description: 'User identifier' })
  userId: number;

  @ApiProperty({ description: 'Contact identifier' })
  contactId: number;
}
