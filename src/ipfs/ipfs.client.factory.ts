import { FactoryProvider } from '@nestjs/common/interfaces';
import { ConfigService } from '@nestjs/config';
import IpfsClient from 'ipfs-http-client';

export const ipfsClientFactory: FactoryProvider<IpfsClient> = {
  provide: IpfsClient,
  useFactory: (config: ConfigService): IpfsClient => {
    const host = config.get<string>('ipfs.host');
    const port = config.get<number>('ipfs.port');
    const protocol = 'https';
    return new IpfsClient({ host, port, protocol });
  },
  inject: [ConfigService],
};
