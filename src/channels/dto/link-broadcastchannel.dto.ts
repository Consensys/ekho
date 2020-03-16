import { ApiProperty } from '@nestjs/swagger';

export default class BroadcastChannelLinkDto {
  @ApiProperty({ description: 'Broadcast channel name' })
  name: string;
  @ApiProperty({ description: 'Broadcast key' })
  broadcastKey: string;
  @ApiProperty({ description: 'Signing key' })
  signingKey: string;
  @ApiProperty({ description: 'Signature' })
  signature: string;
}
