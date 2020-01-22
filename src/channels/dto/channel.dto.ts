import { ApiProperty } from '@nestjs/swagger';

export default class ChannelDto {
  @ApiProperty({ description: 'Channel Id' })
  id: number;
  @ApiProperty({ description: 'Channel name' })
  name: string;
  @ApiProperty({ description: 'Channel key' })
  channelKey: Buffer;
}
