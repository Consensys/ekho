import { ApiProperty } from '@nestjs/swagger';

export default class CreateBroadcastChannelListenerDto {
  @ApiProperty({ description: 'Broadcast channel name' })
  name: string;
  @ApiProperty({ description: 'Broadcast channel listener user' })
  userId: number;
  @ApiProperty({ description: 'Channel contact' })
  contactId: number;
  @ApiProperty({ description: 'Broadcast key' })
  key: string;
}
