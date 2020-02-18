import { ApiProperty } from '@nestjs/swagger';

export default class CreateChannelDto {
  @ApiProperty({ description: 'Channel name' })
  name: string;
  @ApiProperty({ description: 'Channel creator' })
  userId: number;
  @ApiProperty({ description: 'Contact name' })
  contactId: number;
}
