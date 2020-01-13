export default () => ({
    ipfs: {
        host: process.env.IPFS_HOST,
        port: parseInt(process.env.IPFS_PORT, 10) || 5001
    }
});
