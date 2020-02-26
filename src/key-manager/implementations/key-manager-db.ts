import { Repository } from 'typeorm';
import { CryptographyService } from '../../cryptography/cryptography.service';
import { KeyManager } from '../key-manager.interface';
import { DbKeyPair } from './key-manager-db.entity';

export class DbKeyManager implements KeyManager {
  constructor(
    private readonly keypairRepository: Repository<DbKeyPair>,
    private readonly cryptographyService: CryptographyService,
  ) {}

  async createSigningKey(id: number): Promise<void> {
    const { privateKey, publicKey } = this.cryptographyService.generateSigningKeyPair();
    const keypair: DbKeyPair = { id, privateKey, publicKey };
    await this.keypairRepository.save(keypair);
  }

  async readPublicSigningKey(id: number): Promise<string> {
    const keyPair = await this.keypairRepository.findOneOrFail({ select: ['publicKey'], where: { id } });
    return keyPair.publicKey;
  }

  async sign(id: number, data: string): Promise<string> {
    const keyPair = await this.keypairRepository.findOneOrFail({ select: ['privateKey'], where: { id } });
    return this.cryptographyService.generateSignature(Buffer.from(data).toString('base64'), keyPair.privateKey);
  }
}
