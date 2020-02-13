import { Inject, Injectable } from '@nestjs/common';
import { AxiosInstance, AxiosResponse } from 'axios';

@Injectable()
export class VaultService {
  constructor(@Inject('VAULT_CLIENT') private readonly client: AxiosInstance) {}

  async userWritePrivateKey(userId: number, privateKey: string): Promise<void> {
    const payload = {
      data: {
        privateKey,
      },
    };
    const response: AxiosResponse = await this.client.post(`/v1/secret/data/user/${userId}`, payload);
    this.checkResponse(response, `Failed to write private key for user ${userId}`);
  }

  async userReadPrivateKey(userId: number): Promise<string> {
    const response: AxiosResponse = await this.client.get(`/v1/secret/data/user/${userId}`);
    this.checkResponse(response, `Failed to read private key for user ${userId}`);

    return response.data.data.data.privateKey;
  }

  private checkResponse(response: AxiosResponse, context: string) {
    if (!response) {
      throw Error(`${context}: no response`);
    }
    if (response.status !== 200) {
      throw Error(`${context}: server responded ${response.status}`);
    }
  }
}
