import { ApiProperty } from '@nestjs/swagger';

export default class RawMessageDto {
  @ApiProperty({ description: 'Message Contents' })
  messageContents: string;

  @ApiProperty({ description: 'user identifier' })
  userId: number;

  @ApiProperty({ description: 'channel identifier' })
  channelId: number;
}
