export default () => ({
  web3: {
    chain: process.env.WEB3_CHAIN || 'ropsten',
    hardfork: process.env.WEB3_HARDFORK || 'petersburg',
    rpcUrl: process.env.WEB3_RPC_URL,
    contractAddress: process.env.WEB3_CONTRACT_ADDRESS,
    broadcastAccount: {
      address: process.env.WEB3_BROADCAST_ACC_ADDRESS,
      publicKey: process.env.WEB3_BROADCAST_ACC_PUBLIC_KEY,
      privateKey: process.env.WEB3_BROADCAST_ACC_PRIVATE_KEY,
    },
  },
});

export interface EkhoWeb3Config {
  web3: Web3Config;
}

interface Web3Config {
  chain: string;
  hardFork: string;
  rpcUrl: string;
  contractAddress: string;
  broadcastAccount: BroadcastAccountConfig;
}

interface BroadcastAccountConfig {
  address: string;
  publicKey: string;
  privateKey: string;
}

export const mockWeb3Config: EkhoWeb3Config = {
  web3: {
    chain: 'no-such-blockchain',
    hardFork: 'skibbereen',
    rpcUrl: 'wss://no-such-location',
    contractAddress: '0xffffff7f',
    broadcastAccount: {
      address: '0x0',
      publicKey: '0x123',
      privateKey: '0x456',
    },
  },
};

export const getMockWeb3Config = (partial?: Partial<EkhoWeb3Config>): EkhoWeb3Config => {
  if (!partial) {
    partial = {};
  }
  return { ...mockWeb3Config, ...partial };
};
