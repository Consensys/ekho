import { FactoryProvider } from '@nestjs/common/interfaces';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AxiosInstance } from 'axios';

export const vaultFactory: FactoryProvider<AxiosInstance> = {
  provide: 'VAULT_CLIENT',
  useFactory: (config: ConfigService): AxiosInstance => {
    const baseURL = config.get<string>('vault.url');
    const timeout = config.get<number>('vault.timeout');
    const vaultToken = config.get<string>('vault.token');

    const axiosClient: AxiosInstance = axios.create({
      baseURL,
      timeout,
      headers: {
        'X-Vault-Token': vaultToken,
      },
    });
    return axiosClient;
  },
  inject: [ConfigService],
};
