export const mockWeb3 = jest.fn(() => {
  return {
    eth: {
      subscribe: jest.fn(),
    },
  };
});
