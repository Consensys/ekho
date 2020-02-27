import { FactoryProvider } from '@nestjs/common/interfaces';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import axios from 'axios';
import { AxiosInstance } from 'axios';
import { Repository } from 'typeorm';
import { CryptographyService } from '../cryptography/cryptography.service';
import { DbKeyManager } from './implementations/key-manager-db';
import { DbKeyPair } from './implementations/key-manager-db.entity';
import { VaultKeyManager } from './implementations/key-manager-vault';
import { KeyManager } from './key-manager.interface';

export const keyManagerFactory: FactoryProvider<KeyManager> = {
  provide: 'KeyManager',
  useFactory: (
    config: ConfigService,
    keypairRepository: Repository<DbKeyPair>,
    cryptographyService: CryptographyService,
  ): KeyManager => {
    const builders = {
      vault: (): KeyManager => {
        const baseURL = config.get<string>('keymanager.vault.url');
        const timeout = config.get<number>('keymanager.vault.timeout');
        const vaultToken = config.get<string>('keymanager.vault.token');

        const axiosClient: AxiosInstance = axios.create({
          baseURL,
          timeout,
          headers: {
            'X-Vault-Token': vaultToken,
          },
        });
        return new VaultKeyManager(axiosClient, cryptographyService);
      },
      db: (): KeyManager => {
        return new DbKeyManager(keypairRepository, cryptographyService);
      },
    };
    const type = config.get<string>('keymanager.type');
    const builder = builders[type];
    if (!builder) {
      throw Error(`Unexpected key-manager.type value: ${type ? type : 'undefined (missing KEY_MANAGER_TYPE in .env)'}`);
    }
    return builder();
  },
  inject: [ConfigService, getRepositoryToken(DbKeyPair), CryptographyService],
};
