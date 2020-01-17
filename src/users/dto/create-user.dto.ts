import { ApiProperty } from '@nestjs/swagger';

export default class CreateUserDto {
  @ApiProperty({ description: 'User name' })
  name: string;
  privateSigningKey: Buffer;
  publicSigningKey: Buffer;
}
