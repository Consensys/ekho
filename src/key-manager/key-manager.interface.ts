import { QueryRunner } from 'typeorm';

export interface KeyManager {
  createSigningKey(id: number, queryRunner?: QueryRunner): Promise<void>;
  readPublicSigningKey(id: number): Promise<string>;
  sign(id: number, data: string): Promise<string>;
  verifySignatureById(id: number, signature: string, data: string): Promise<boolean>;
  verifySignature(signature: string, data: string, publicKey: string): Promise<boolean>;
}
