import { ApiProperty } from '@nestjs/swagger';

export default class SendMessageDto {
  @ApiProperty({ description: 'From' })
  from: string;

  @ApiProperty({ description: 'To' })
  to: string;

  @ApiProperty({ description: 'Content' })
  content: string;

  // TODO: for now exposing the channel id for simplicity; this will be calculated internally in the future
  @ApiProperty({ description: 'Channel ID' })
  channelId: string;
}
