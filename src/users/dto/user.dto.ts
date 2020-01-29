import { ApiProperty } from '@nestjs/swagger';

export default class UserDto {
  @ApiProperty({ description: 'User ID' })
  id: number;
  @ApiProperty({ description: 'User name' })
  name: string;
}
