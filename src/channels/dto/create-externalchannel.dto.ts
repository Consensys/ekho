import { ApiProperty } from '@nestjs/swagger';
import { Field, InputType } from 'type-graphql';

@InputType()
export default class CreateExternalChannelDto {
  @Field()
  @ApiProperty({ description: 'Channel creator' })
  userId: number;
  @ApiProperty({ description: 'Channel name' })
  name: string;
  @ApiProperty({ description: 'Contact Name' })
  contactName: string;
  @ApiProperty({ description: 'Contact Integration Identifier' })
  contactIntegrationId: string;
  @ApiProperty({ description: 'Contact Public Key' })
  contactPublicKey: string;
  @ApiProperty({ description: 'Contact Shared Secret' })
  channelSharedSecret: string;
}
