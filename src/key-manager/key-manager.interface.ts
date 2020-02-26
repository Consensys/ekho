export interface KeyManager {
  createSigningKey(id: number): Promise<void>;
  readPublicSigningKey(id: number): Promise<string>;
  sign(id: number, data: string): Promise<string>;
}
