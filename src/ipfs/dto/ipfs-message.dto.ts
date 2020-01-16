import { ApiProperty } from '@nestjs/swagger';

export class IpfsMessageDto {
  @ApiProperty({ description: 'From' })
  from: string;

  @ApiProperty({ description: 'To' })
  to: string;

  @ApiProperty({ description: 'Content' })
  content: string;
}
