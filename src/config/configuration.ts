export default () => ({
    port: parseInt(process.env.PORT, 10) || 3001,
    ipfs: {
        host: process.env.IPFS_HOST,
        port: parseInt(process.env.IPFS_PORT, 10) || 5001
    }
});
