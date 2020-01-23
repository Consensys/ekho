export const mockIpfsClient = jest.fn(() => {
  return {
    get: jest.fn(),
    add: jest.fn(),
  };
});
