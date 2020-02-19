import { Inject, Injectable } from '@nestjs/common';
import { AxiosInstance, AxiosResponse } from 'axios';

@Injectable()
export class VaultService {
  constructor(@Inject('VAULT_CLIENT') private readonly client: AxiosInstance) {}

  async createSigningKey(userId: number): Promise<void> {
    const payload = {
      type: 'ed25519',
      derived: false,
    };
    const response: AxiosResponse = await this.client.post(`/v1/users-signing-keys/keys/${userId}`, payload);
    this.checkResponse(response, `Failed to create private signing keys for user ${userId}`, 204);
  }

  async readPublicSigningKey(userId: number): Promise<string> {
    const response: AxiosResponse = await this.client.get(`/v1/users-signing-keys/keys/${userId}`);
    this.checkResponse(response, `Failed to create private signing keys for user ${userId}`);
    return response.data.data.keys['1'].public_key;
  }

  async sign(userId: number, data: string): Promise<string> {
    const payload = {
      input: Buffer.from(data).toString('base64'),
    };
    const response: AxiosResponse = await this.client.post(`/v1/users-signing-keys/sign/${userId}`, payload);
    this.checkResponse(response, `Failed to create private signing keys for user ${userId}`);
    const fullSignature: string = response.data.data.signature;
    const signature = fullSignature.split(':')[2];
    return signature;
  }

  private checkResponse(response: AxiosResponse, context: string, expectedStatus = 200) {
    if (!response) {
      throw Error(`${context}: no response`);
    }
    if (response.status !== expectedStatus) {
      throw Error(`${context}: server responded ${response.status}`);
    }
  }
}
