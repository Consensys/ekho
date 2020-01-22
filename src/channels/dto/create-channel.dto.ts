import { ApiProperty } from '@nestjs/swagger';

export default class CreateChannelDto {
  @ApiProperty({ description: 'Channel name' })
  name: string;
  @ApiProperty({ description: 'Channel key' })
  channelKey: Buffer;
}
