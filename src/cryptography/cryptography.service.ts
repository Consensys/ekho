import { Injectable } from '@nestjs/common';
import SodiumNative from 'sodium-native';
import { CryptographyKeyPairDto } from './dto/cryptography-keypair.dto';

@Injectable()
export class CryptographyService {
  /**
   * Generates a public and private signing key pair (ed25519)
   * @returns dto containing public and private key buffers
   */
  async generateSigningKeyPair(): Promise<CryptographyKeyPairDto> {
    const publicSigningKey: Buffer = await this.getZeroedBuffer(SodiumNative.crypto_sign_PUBLICKEYBYTES);
    const privateSigningKey: Buffer = await this.getZeroedBuffer(SodiumNative.crypto_sign_SECRETKEYBYTES);

    SodiumNative.crypto_sign_keypair(publicSigningKey, privateSigningKey);

    const keyPair: CryptographyKeyPairDto = {
      publicKey: publicSigningKey,
      privateKey: privateSigningKey,
    };

    return keyPair;
  }

  /**
   * Generate a public and private one-use key pair (c25519)
   * This is used to perform Diffie-Hellman secret exchanges
   * not for signing!
   * @returns dto containing public and private key buffers
   */
  async generateOneUseKeyPair(): Promise<CryptographyKeyPairDto> {
    const publicOneUseKey: Buffer = await this.getZeroedBuffer(SodiumNative.crypto_scalarmult_BYTES);
    const privateOneUseKey: Buffer = await this.getRandomisedBuffer(SodiumNative.crypto_scalarmult_SCALARBYTES);

    SodiumNative.crypto_scalarmult_base(publicOneUseKey, privateOneUseKey);

    const keyPair: CryptographyKeyPairDto = {
      publicKey: publicOneUseKey,
      privateKey: privateOneUseKey,
    };

    return keyPair;
  }

  /**
   * Generates an ECDH shared secret from one-use keys
   * @param publicKey other party public one-use key
   * @param privateKey user private one-use key
   * @returns sharedSecret buffer containing ECDH shared secret
   */
  async generateECDHSharedSecret(publicKey: Buffer, privateKey: Buffer): Promise<Buffer> {
    const sharedSecret: Buffer = await this.getZeroedBuffer(SodiumNative.crypto_scalarmult_BYTES);

    SodiumNative.crypto_scalarmult(sharedSecret, privateKey, publicKey);

    return sharedSecret;
  }

  /**
   * Generates a digital signature of data using the private signing key
   * @param data data to be signed
   * @param privateSigningKey key used to sign data
   * @returns buffer containing signature
   */
  async generateSignature(data: Buffer, privateSigningKey: Buffer): Promise<Buffer> {
    const signature: Buffer = await this.getZeroedBuffer(SodiumNative.crypto_sign_BYTES);

    SodiumNative.crypto_sign_detached(signature, data, privateSigningKey);

    return signature;
  }

  /**
   * Validates a digital signature of data using the public signing key
   * @param signature detached signature of data param
   * @param data data that has been signed
   * @param publicSigningKey public key of signing keypair used to sign data
   * @returns boolean true/false if signature valid/invalid
   */
  async validateSignature(signature: Buffer, data: Buffer, publicSigningKey: Buffer): Promise<boolean> {
    const retval: boolean = SodiumNative.crypto_sign_verify_detached(signature, data, publicSigningKey);

    return retval;
  }

  /**
   * Generates a SHA256 hash
   * @param data input buffer to be hashed
   * @returns buffer containing the 32-byte SHA-256 hash
   */
  async generateSHA256Hash(data: Buffer): Promise<Buffer> {
    const outputHash: Buffer = await this.getZeroedBuffer(SodiumNative.crypto_hash_sha256_BYTES);

    SodiumNative.crypto_hash_sha256(outputHash, data);

    return outputHash;
  }

  /**
   * Derives a symmetric key from secret
   * @param secret input buffer containing key derivation secret
   * @param nonce number used once - must not be reused or secret will be exposed!
   * @param context string describing context of key generation
   * @returns buffer containing the derived 32-byte symmetric key
   */
  async deriveSymmetricKeyfromSecret(secret: Buffer, nonce: number, context: string): Promise<Buffer> {
    const outputSymmetricKey: Buffer = await this.getZeroedBuffer(SodiumNative.crypto_kdf_KEYBYTES);
    const keyContext: Buffer = Buffer.from(context);

    SodiumNative.crypto_kdf_derive_from_key(outputSymmetricKey, nonce, keyContext, secret);

    return outputSymmetricKey;
  }

  /**
   * Generates an 8-byte buffer from nonce
   * @param nonce number passed in - either random 32-bit integer or counter
   * @returns nonceBuffer padded noncebuffer suitable for use in chacha20 encryption/decryption
   */
  async generateNonceBuffer(nonce: number): Promise<Buffer> {
    const nonceBuffer = await this.getZeroedBuffer(SodiumNative.crypto_stream_chacha20_NONCEBYTES);

    nonceBuffer.writeUInt32BE(nonce, 0);

    return nonceBuffer;
  }

  /**
   * Encrypts data using a symmetric key and nonce
   * @param data data buffer to be encrypted
   * @param nonce number used once - must not be reused or secret will be exposed
   * @param key symmetric key used to encrypt data
   * @returns buffer containing encrypted data
   */
  async encrypt(data: Buffer, nonce: Buffer, key: Buffer): Promise<Buffer> {
    const encryptedData: Buffer = await this.getZeroedBuffer(data.length);

    SodiumNative.crypto_stream_chacha20_xor(encryptedData, data, nonce, key);

    return encryptedData;
  }

  /**
   * Decrypts data using a symmetric key and nonce
   * @param data data buffer to be decrypted
   * @param nonce number used once - must not be reused or secret will be exposed
   * @param key symmetric key used to decrypt data
   * @returns buffer containing decrypted data
   */
  async decrypt(data: Buffer, nonce: Buffer, key: Buffer): Promise<Buffer> {
    const decryptedData: Buffer = await this.getZeroedBuffer(data.length);

    SodiumNative.crypto_stream_chacha20_xor(decryptedData, data, nonce, key);

    return decryptedData;
  }

  /**
   * Generates 32-bit random number
   */
  async generateRandomNumber(): Promise<number> {
    const retval = SodiumNative.randombytes_random();

    return retval;
  }

  /**
   * Generates a random 32-byte buffer
   */
  async generateRandomBytes(): Promise<Buffer> {
    const retval = Buffer.alloc(32);
    SodiumNative.randombytes_buf(retval);
    return retval;
  }

  async getZeroedBuffer(size: number): Promise<Buffer> {
    const buff = SodiumNative.sodium_malloc(size);
    SodiumNative.sodium_memzero(buff);
    return buff;
  }

  async getRandomisedBuffer(size: number): Promise<Buffer> {
    const buff = await this.getZeroedBuffer(size);
    SodiumNative.randombytes_buf(buff);
    return buff;
  }
}
