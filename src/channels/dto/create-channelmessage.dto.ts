import { ApiProperty } from '@nestjs/swagger';

export default class CreateChannelMessageDto {
  @ApiProperty({ description: 'Message contents' })
  messageContents: string;

  @ApiProperty({ description: 'Channel member identifier' })
  channelMemberId: number;
}
