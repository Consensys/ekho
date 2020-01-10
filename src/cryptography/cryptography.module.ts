import { Module } from '@nestjs/common';
import { CryptographyService } from './cryptography.service';

@Module({
  providers: [CryptographyService]
})
export class CryptographyModule {}
