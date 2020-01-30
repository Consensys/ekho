import { ApiProperty } from '@nestjs/swagger';

export default class ChannelMessageDto {
  @ApiProperty({ description: 'Message contents' })
  messageContents: string;

  @ApiProperty({ description: 'Channel member identifier' })
  channelMemberId: string;

  @ApiProperty({ description: 'Message nonce' })
  nonce: number;
}
