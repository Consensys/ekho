import { ApiProperty } from '@nestjs/swagger';

export default class ReceivedMessageDto {
  @ApiProperty({ description: 'Message Contents' })
  messageContents: string;

  @ApiProperty({ description: 'Channel Member Id' })
  channelMemberId: number;
}
