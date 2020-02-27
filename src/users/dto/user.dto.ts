import { ApiProperty } from '@nestjs/swagger';
import { Field, InputType } from 'type-graphql';
import { User } from '../entities/users.entity';

@InputType({ description: 'Partial User' })
export default class UserDto implements Partial<User> {
  @Field()
  @ApiProperty({ description: 'User ID' })
  id: number;

  @Field()
  @ApiProperty({ description: 'User name' })
  name: string;
}
