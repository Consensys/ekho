import { ApiProperty } from '@nestjs/swagger';
import EncodedMessageDto from './encodedmessage.dto';

export default class ProcessReport {
  @ApiProperty({ description: 'Processed Events' })
  processedTotal: number;

  @ApiProperty({ description: 'Received Messages' })
  receivedMessages: number;

  @ApiProperty({ description: 'Received Message Events' })
  receivedMessageEvents: EncodedMessageDto[];
}
