import { Injectable } from '@nestjs/common';
import SodiumNative from 'sodium-native';
import { CryptographyKeyPairDto } from './dto/cryptography-keypair.dto';

const BASE64 = 'base64';

@Injectable()
export class CryptographyService {
  /**
   * Generates a public and private signing key pair (ed25519)
   * @returns dto containing public and private key buffers
   */
  generateSigningKeyPair(): CryptographyKeyPairDto {
    const publicSigningKey: Buffer = this.getZeroedBuffer(SodiumNative.crypto_sign_PUBLICKEYBYTES);
    const privateSigningKey: Buffer = this.getZeroedBuffer(SodiumNative.crypto_sign_SECRETKEYBYTES);

    SodiumNative.crypto_sign_keypair(publicSigningKey, privateSigningKey);

    const keyPair: CryptographyKeyPairDto = {
      publicKey: publicSigningKey.toString(BASE64),
      privateKey: privateSigningKey.toString(BASE64),
    };

    return keyPair;
  }

  /**
   * Generate a public and private one-use key pair (c25519)
   * This is used to perform Diffie-Hellman secret exchanges
   * not for signing!
   * @returns dto containing public and private key buffers
   */
  generateOneUseKeyPair(): CryptographyKeyPairDto {
    const publicOneUseKey: Buffer = this.getZeroedBuffer(SodiumNative.crypto_scalarmult_BYTES);
    const privateOneUseKey: Buffer = this.getRandomisedBuffer(SodiumNative.crypto_scalarmult_SCALARBYTES);

    SodiumNative.crypto_scalarmult_base(publicOneUseKey, privateOneUseKey);

    const keyPair: CryptographyKeyPairDto = {
      publicKey: publicOneUseKey.toString(BASE64),
      privateKey: privateOneUseKey.toString(BASE64),
    };

    return keyPair;
  }

  /**
   * Generates an ECDH shared secret from one-use keys
   * @param publicKey other party public one-use key
   * @param privateKey user private one-use key
   * @returns sharedSecret buffer containing ECDH shared secret
   */
  generateECDHSharedSecret(publicKey: string, privateKey: string): string {
    const sharedSecret: Buffer = this.getZeroedBuffer(SodiumNative.crypto_scalarmult_BYTES);

    SodiumNative.crypto_scalarmult(sharedSecret, Buffer.from(privateKey, BASE64), Buffer.from(publicKey, BASE64));

    return sharedSecret.toString(BASE64);
  }

  /**
   * Generates a digital signature of data using the private signing key
   * @param data data to be signed
   * @param privateSigningKey key used to sign data
   * @returns buffer containing signature
   */
  generateSignature(data: string, privateSigningKey: string): string {
    const signature: Buffer = this.getZeroedBuffer(SodiumNative.crypto_sign_BYTES);

    SodiumNative.crypto_sign_detached(signature, Buffer.from(data), Buffer.from(privateSigningKey, BASE64));

    return signature.toString(BASE64);
  }

  /**
   * Validates a digital signature of data using the public signing key
   * @param signature detached signature of data param
   * @param data data that has been signed
   * @param publicSigningKey public key of signing keypair used to sign data
   * @returns boolean true/false if signature valid/invalid
   */
  validateSignature(signature: string, data: string, publicSigningKey: string): boolean {
    const retval: boolean = SodiumNative.crypto_sign_verify_detached(
      Buffer.from(signature, BASE64),
      Buffer.from(data),
      Buffer.from(publicSigningKey, BASE64),
    );

    return retval;
  }

  /**
   * Generates a SHA256 hash
   * @param data input buffer to be hashed
   * @returns buffer containing the 32-byte SHA-256 hash
   */
  generateSHA256Hash(data: string): string {
    const outputHash: Buffer = this.getZeroedBuffer(SodiumNative.crypto_hash_sha256_BYTES);

    SodiumNative.crypto_hash_sha256(outputHash, Buffer.from(data));

    return outputHash.toString('hex');
  }

  /**
   * Derives a symmetric key from secret
   * @param secret input buffer containing key derivation secret
   * @param nonce number used once - must not be reused or secret will be exposed!
   * @param context string describing context of key generation
   * @returns buffer containing the derived 32-byte symmetric key
   */
  deriveSymmetricKeyfromSecret(secret: string, nonce: number, context: string): string {
    const outputSymmetricKey: Buffer = this.getZeroedBuffer(SodiumNative.crypto_kdf_KEYBYTES);
    const keyContext: Buffer = Buffer.from(context);

    SodiumNative.crypto_kdf_derive_from_key(outputSymmetricKey, nonce, keyContext, Buffer.from(secret, BASE64));

    return outputSymmetricKey.toString(BASE64);
  }

  /**
   * Generates an 8-byte buffer from nonce
   * @param nonce number passed in - either random 32-bit integer or counter
   * @returns nonceBuffer padded noncebuffer suitable for use in chacha20 encryption/decryption
   */
  generateNonceBuffer(nonce: number): Buffer {
    const nonceBuffer = this.getZeroedBuffer(SodiumNative.crypto_stream_chacha20_NONCEBYTES);

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
  encrypt(
    dataStr: string,
    nonceNumber: number,
    keyStr: string,
    dataEncoding: BufferEncoding = 'utf-8',
    encryptedEncoding: BufferEncoding = 'hex',
  ): string {
    const data = Buffer.from(dataStr, dataEncoding);
    const nonce = this.generateNonceBuffer(nonceNumber);
    const key = Buffer.from(keyStr);
    const encryptedData: Buffer = this.getZeroedBuffer(data.length);

    SodiumNative.crypto_stream_chacha20_xor(encryptedData, data, nonce, key);

    return encryptedData.toString(encryptedEncoding);
  }

  /**
   * Decrypts data using a symmetric key and nonce
   * @param data data buffer to be decrypted
   * @param nonce number used once - must not be reused or secret will be exposed
   * @param key symmetric key used to decrypt data
   * @returns buffer containing decrypted data
   */
  decrypt(
    dataStr: string,
    nonceNumber: number,
    keyStr: string,
    dataEncoding = 'utf-8',
    encryptedEncoding: BufferEncoding = 'hex',
  ): string {
    const data = Buffer.from(dataStr, encryptedEncoding);
    const nonce = this.generateNonceBuffer(nonceNumber);
    const key = Buffer.from(keyStr);
    const decryptedData: Buffer = this.getZeroedBuffer(data.length);

    SodiumNative.crypto_stream_chacha20_xor(decryptedData, data, nonce, key);

    return decryptedData.toString(dataEncoding);
  }

  /**
   * Generates 32-bit random number
   */
  generateRandomNumber(): number {
    return SodiumNative.randombytes_random();
  }

  /**
   * Generates a random 32-byte buffer
   */
  generateRandomBytes(): Buffer {
    const retval = Buffer.alloc(32);
    SodiumNative.randombytes_buf(retval);
    return retval;
  }

  getZeroedBuffer(size: number): Buffer {
    const buff = SodiumNative.sodium_malloc(size);
    SodiumNative.sodium_memzero(buff);
    return buff;
  }

  getRandomisedBuffer(size: number): Buffer {
    const buff = this.getZeroedBuffer(size);
    SodiumNative.randombytes_buf(buff);
    return buff;
  }
}
