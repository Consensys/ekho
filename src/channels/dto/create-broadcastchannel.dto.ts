import { ApiProperty } from '@nestjs/swagger';

export default class CreateBroadcastChannelDto {
  @ApiProperty({ description: 'Broadcast channel name' })
  name: string;
  @ApiProperty({ description: 'Channel creator' })
  userId: number;
}
