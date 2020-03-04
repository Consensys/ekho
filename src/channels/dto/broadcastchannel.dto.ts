import { ApiProperty } from '@nestjs/swagger';

export default class BroadcastChannelDto {
  @ApiProperty({ description: 'Broadcast channel name' })
  name: string;
  @ApiProperty({ description: 'Channel creator' })
  userId: number;
  @ApiProperty({ description: 'Channel id' })
  channelId: number;
  @ApiProperty({ description: 'Broadcast key' })
  broadcastKey: string;
}
