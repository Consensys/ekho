export const mockWeb3 = jest.fn(() => {
  return {
    eth: {
      subscribe: jest.fn(),
    },
  };
});

export const mockWeb3Service = jest.fn(() => {
  return {
    emitEvent: jest.fn(),
    getTransactionCount: jest.fn(),
    sendSignerTransaction: jest.fn(),
  };
});
