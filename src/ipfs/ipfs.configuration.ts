export default () => ({
  ipfs: {
    host: process.env.IPFS_HOST,
    port: parseInt(process.env.IPFS_PORT, 10) || 5001,
  },
});

export const mockIpfsConfigValues = { ipfs: { host: '127.0.0.1', port: '8080' } };
