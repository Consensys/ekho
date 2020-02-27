import { ApiProperty } from '@nestjs/swagger';
import { Field, InputType } from 'type-graphql';

@InputType()
export default class ChannelDto {
  @Field()
  @ApiProperty({ description: 'Channel Id' })
  id: number;

  @Field()
  @ApiProperty({ description: 'Channel name' })
  name: string;

  @Field()
  @ApiProperty({ description: 'Channel key' })
  channelKey: string;
}
