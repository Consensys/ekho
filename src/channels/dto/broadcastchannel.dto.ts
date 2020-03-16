import { ApiProperty } from '@nestjs/swagger';
import BroadcastChannelLinkDto from './link-broadcastchannel.dto';

/*export default class BroadcastChannelDto {
  @ApiProperty({ description: 'Broadcast channel name' })
  name: string;
  @ApiProperty({ description: 'Channel creator' })
  userId: number;
  @ApiProperty({ description: 'Channel id' })
  channelId: number;
  @ApiProperty({ description: 'Broadcast key' })
  broadcastKey: string;
}*/

export default class BroadcastChannelDto {
  @ApiProperty({ description: 'Channel creator' })
  userId: number;
  @ApiProperty({ description: 'Channel id' })
  channelId: number;
  @ApiProperty({ description: 'Broadcast link' })
  broadcastLink: BroadcastChannelLinkDto;
}
