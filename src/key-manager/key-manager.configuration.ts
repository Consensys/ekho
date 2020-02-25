export default () => ({
  keymanager: {
    type: process.env.KEY_MANAGER_TYPE || 'dafuq',
    vault: {
      url: process.env.VAULT_URL,
      timeout: parseInt(process.env.VAULT_TIMEOUT, 10) || 10000,
      token: process.env.VAULT_TOKEN,
    },
  },
});
