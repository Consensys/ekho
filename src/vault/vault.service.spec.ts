import { Test, TestingModule } from '@nestjs/testing';
import { VaultService } from './vault.service';

describe('VaultService', () => {
  const axiosClient = {
    get: jest.fn(),
    post: jest.fn(),
  };
  let service: VaultService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VaultService, { provide: 'VAULT_CLIENT', useValue: axiosClient }],
    }).compile();

    service = module.get<VaultService>(VaultService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  /*
  it('should succeed writting user private key', async () => {
    const userId = 1;
    const privateKey = 'this-is-a-private-key-from-vault';
    const payload = {
      data: {
        privateKey,
      },
    };
    axiosClient.post.mockReturnValueOnce({
      status: 200,
    });
    await service.userWritePrivateKey(userId, privateKey);
    expect(axiosClient.post).toBeCalledWith(`/v1/secret/data/user/${userId}`, payload);
  });

  it('should fail writting user private key when HTTP different from 200', async () => {
    const userId = -1;
    const privateKey = 'this-is-a-private-key-from-vault';
    const expectedError = `Failed to write private key for user ${userId}: server responded 500`;
    axiosClient.post.mockReturnValueOnce({
      status: 500,
    });
    await expect(service.userWritePrivateKey(userId, privateKey)).rejects.toThrow(expectedError);
  });

  it('should succeed reading user private key', async () => {
    const userId = 1;
    const privateKey = 'this-is-a-private-key-from-vault';
    axiosClient.get.mockReturnValueOnce({
      status: 200,
      data: {
        data: {
          data: {
            privateKey,
          },
        },
      },
    });
    const privateKeyResponse = await service.userReadPrivateKey(userId);
    expect(privateKeyResponse).toStrictEqual(privateKey);
    expect(axiosClient.get).toBeCalledWith(`/v1/secret/data/user/${userId}`);
  });

  it('should fail reading user private key when HTTP different from 200', async () => {
    const userId = -1;
    const expectedError = `Failed to read private key for user ${userId}: server responded 500`;
    axiosClient.get.mockReturnValueOnce({
      status: 500,
    });
    await expect(service.userReadPrivateKey(userId)).rejects.toThrow(expectedError);
  });
  */
});
