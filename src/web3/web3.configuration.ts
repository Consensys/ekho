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
