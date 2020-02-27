import { ApiProperty } from '@nestjs/swagger';
import { Field, InputType } from 'type-graphql';
import { User } from '../entities/users.entity';

@InputType({ description: 'New user name' })
export default class CreateUserDto implements Partial<User> {
  @Field()
  @ApiProperty({ description: 'User name' })
  name: string;
}
