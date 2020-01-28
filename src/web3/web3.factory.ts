import { FactoryProvider } from '@nestjs/common/interfaces';
import { ConfigService } from '@nestjs/config';
import Web3 from 'web3';

export const Web3Factory: FactoryProvider<Web3> = {
  provide: Web3,
  useFactory: (config: ConfigService): Web3 => {
    const rpcUrl = config.get('web3.rpcUrl');
    return new Web3(new Web3.providers.WebsocketProvider(rpcUrl));
  },
  inject: [ConfigService],
};
