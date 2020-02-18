import { ApiProperty } from '@nestjs/swagger';

export default class RawMessageDto {
  @ApiProperty({ description: 'Message Contents' })
  messageContents: string;

  @ApiProperty({ description: 'Channel Member Id' })
  channelMemberId: number;
}
