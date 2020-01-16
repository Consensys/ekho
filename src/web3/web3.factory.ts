import Web3 from 'web3';

export class Web3Factory {
  getWeb3(rpcUrl: string): Web3 {
    return new Web3(new Web3.providers.WebsocketProvider(rpcUrl));
  }
}
