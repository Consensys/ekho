import { ApiProperty } from '@nestjs/swagger';

export default class EncodedMessageDto {
  @ApiProperty({ description: 'Channel Identifier' })
  channelIdentifier: string;

  @ApiProperty({ description: 'Encrypted Message Link' })
  encryptedMessageLink: string;

  @ApiProperty({ description: 'Message Link Signature' })
  encryptedMessageLinkSignature: string;
}
