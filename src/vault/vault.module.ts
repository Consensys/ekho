import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { vaultFactory } from './vault.factory';
import { VaultService } from './vault.service';

@Module({
  providers: [vaultFactory, VaultService, ConfigService],
  exports: [VaultService],
})
export class VaultModule {}
