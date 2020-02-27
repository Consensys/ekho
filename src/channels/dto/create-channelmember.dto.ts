import { ApiProperty } from '@nestjs/swagger';
import { Field, InputType } from 'type-graphql';

@InputType()
export default class CreateChannelMemberDto {
  @Field()
  @ApiProperty({ description: 'Message Chain Key' })
  messageChainKey: string;

  @ApiProperty({ description: 'Channel identifier' })
  channelId: number;

  @Field()
  @ApiProperty({ description: 'User identifier' })
  userId: number;

  @Field()
  @ApiProperty({ description: 'Contact identifier' })
  contactId: number;
}
