import { ApiProperty } from '@nestjs/swagger';

export class IpfsMessageDto {
    @ApiProperty({ description: 'Message' })
    message: string;
}
