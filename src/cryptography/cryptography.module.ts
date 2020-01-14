import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CryptographyService } from './cryptography.service';

@Module({
  providers: [CryptographyService],
  exports: [CryptographyService]
})
export class CryptographyModule {}
