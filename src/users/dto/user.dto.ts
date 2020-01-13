import { ApiProperty } from '@nestjs/swagger';

export default class UserDto {
  @ApiProperty({ description: 'User name' })
  name: string;
}
