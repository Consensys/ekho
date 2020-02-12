import { ApiProperty } from '@nestjs/swagger';
import { Field, InputType } from 'type-graphql';

@InputType()
export default class SendMessageDto {
  @Field()
  @ApiProperty({ description: 'From' })
  from: string;

  @Field()
  @ApiProperty({ description: 'To' })
  to: string;

  @Field()
  @ApiProperty({ description: 'Content' })
  content: string;

  // TODO: for now exposing the channel id for simplicity; this will be calculated internally in the future
  @Field()
  @ApiProperty({ description: 'Channel ID' })
  channelId: string;
}
