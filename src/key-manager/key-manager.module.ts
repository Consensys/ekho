import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptographyModule } from '../cryptography/cryptography.module';
import { DbKeyPair } from './implementations/key-manager-db.entity';
import { keyManagerFactory } from './key-manager.factory';

@Module({
  imports: [TypeOrmModule.forFeature([DbKeyPair]), CryptographyModule],
  providers: [keyManagerFactory],
  exports: [keyManagerFactory],
})
export class KeyManagerModule {}
