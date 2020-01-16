import { Test, TestingModule } from '@nestjs/testing';
import SodiumNative from 'sodium-native';
import { CryptographyService } from './cryptography.service';
import { CryptographyKeyPairDto } from './dto/cryptography-keypair.dto';

describe('CryptographyService', () => {
  let service: CryptographyService;

  const generateAnonKeys = async () => {
    const signingPair = await service.generateSigningKeyPair();
    const oneTimePair = await service.generateOneUseKeyPair();

    return {
      signingPair,
      oneTimePair,
    };
  };

  interface TestSubject {
    signingPair: CryptographyKeyPairDto;
    oneTimePair: CryptographyKeyPairDto;
  }
  const generateAlicenBob = async (): Promise<{ alice: TestSubject; bob: TestSubject; trudy: TestSubject }> => {
    const alice = await generateAnonKeys();
    const bob = await generateAnonKeys();
    const trudy = await generateAnonKeys();
    return {
      alice,
      bob,
      trudy,
    };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptographyService],
    }).compile();

    service = module.get<CryptographyService>(CryptographyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('can generate cryptographic keys:', () => {
    it('.generateSigningKeyPair should generate a CryptographyKeyPair', async () => {
      const { publicKey, privateKey }: CryptographyKeyPairDto = await service.generateSigningKeyPair();

      expect(publicKey).toBeInstanceOf(Buffer);
      expect(publicKey).toHaveProperty('length', SodiumNative.crypto_sign_PUBLICKEYBYTES);
      expect(privateKey).toBeInstanceOf(Buffer);
      expect(privateKey).toHaveProperty('length', SodiumNative.crypto_sign_SECRETKEYBYTES);
    });

    it('.generateOneUseKeyPair should generate a single use key pair', async () => {
      const { publicKey, privateKey }: CryptographyKeyPairDto = await service.generateOneUseKeyPair();

      expect(publicKey).toBeInstanceOf(Buffer);
      expect(publicKey).toHaveProperty('length', SodiumNative.crypto_scalarmult_BYTES);
      expect(privateKey).toBeInstanceOf(Buffer);
      expect(privateKey).toHaveProperty('length', SodiumNative.crypto_scalarmult_SCALARBYTES);
    });
  });

  describe('generateSHA256Hash', () => {
    it('should be able to hash shit', async () => {
      const anon = Buffer.from(`durrr I'm a bunch of data, lalala.`);
      const actual = await service.generateSHA256Hash(anon);

      expect(actual).toBeInstanceOf(Buffer);
      expect(actual).toHaveProperty('length', SodiumNative.crypto_hash_sha256_BYTES);
    });

    it('hashes should be deterministic', async () => {
      const one = Buffer.from('the truth shall make ye fret');
      const other = Buffer.from(String('the truth shall make ye fret'));

      const expected = service.generateSHA256Hash(one);
      const actual = service.generateSHA256Hash(other);

      expect(actual).toEqual(expected);
    });
  });

  describe('generateNonceBuffer', () => {
    it('should return a number as an 8 byte buffer', async () => {
      const anon = 1234;
      const actual = await service.generateNonceBuffer(anon);
      const expected = Buffer.alloc(8);
      expected.writeUInt32BE(anon, 0);

      expect(actual).toBeInstanceOf(Buffer);
      expect(actual).toHaveProperty('length', SodiumNative.crypto_stream_chacha20_NONCEBYTES);
      expect(actual.readUInt32BE(0)).toEqual(expected.readUInt32BE(0));
    });
  });

  describe('cryptography service utility functions', () => {
    it('.generateRandomNumber generates a random number between 0 and 0xffffffff', async () => {
      const actual = await service.generateRandomNumber();

      expect(typeof actual).toEqual(typeof 1234);
      expect(actual >= 0).toBe(true);
      expect(actual <= 0xffffffff).toBe(true);
    });

    it('.generateRandomBytes generates a 32 byte Buffer of unpredictable bytes', async () => {
      const actual = await service.generateRandomBytes();

      expect(actual).toBeInstanceOf(Buffer);
      expect(actual).toHaveProperty('length', 32);
    });
  });

  describe('can generate and validate digital signature', () => {
    let alice: CryptographyKeyPairDto;
    let bob: CryptographyKeyPairDto;

    beforeAll(async () => {
      alice = await service.generateSigningKeyPair();
      bob = await service.generateSigningKeyPair();
    });

    it('given a data buffer and private signing key,generateSignature generates signature', async () => {
      const anonData = Buffer.from(`I'm totally Alice.`);

      const actual = await service.generateSignature(anonData, alice.privateKey);

      expect(actual).toBeInstanceOf(Buffer);
      expect(actual).toHaveProperty('length', SodiumNative.crypto_sign_BYTES);
    });

    it('can validate a signature against expected public key and the expected data', async () => {
      const anonData = Buffer.from(`I'm totally Alice.`);

      const signature = await service.generateSignature(anonData, alice.privateKey);

      const actual = await service.validateSignature(signature, anonData, alice.publicKey);

      expect(actual).toBe(true);
    });

    it('can refuse to validate a signature against expected public key and the wrong data', async () => {
      const expectedData = Buffer.from(`I'm totally Alice.`);
      const incorrectData = Buffer.from('Fascist lies!');

      const signature = await service.generateSignature(expectedData, alice.privateKey);

      const actual = await service.validateSignature(signature, incorrectData, alice.publicKey);

      expect(actual).toBe(false);
    });

    it('can refuse to validate a signature against wrong public key and the expected data', async () => {
      const expectedData = Buffer.from(`I'm totally Alice.`);

      const signature = await service.generateSignature(expectedData, alice.privateKey);

      const actual = await service.validateSignature(signature, expectedData, bob.publicKey);

      expect(actual).toBe(false);
    });
  });

  describe('generate and verify shared secret', () => {
    let alice: TestSubject;
    let bob: TestSubject;

    beforeAll(async () => {
      const testSubjects = await generateAlicenBob();
      alice = testSubjects.alice;
      bob = testSubjects.bob;
    });

    it('generate a shared secret from your public and my private one-time keys', async () => {
      const actual = await service.generateECDHSharedSecret(bob.oneTimePair.publicKey, alice.oneTimePair.privateKey);

      expect(actual).toBeInstanceOf(Buffer);
      expect(actual).toHaveProperty('length', SodiumNative.crypto_scalarmult_BYTES);
    });

    it('independently generated shared secret should be common when two users exchanged public one-time keys', async () => {
      const aliceSharedSecret = await service.generateECDHSharedSecret(
        bob.oneTimePair.publicKey,
        alice.oneTimePair.privateKey,
      );
      const bobSharedSecret = await service.generateECDHSharedSecret(
        alice.oneTimePair.publicKey,
        bob.oneTimePair.privateKey,
      );

      expect(aliceSharedSecret.toString('base64')).toEqual(bobSharedSecret.toString('base64'));
    });

    it('should be able to verify signature of a one-time public key', async () => {
      const aliceOneTimePubKeySignature = await service.generateSignature(
        alice.oneTimePair.publicKey,
        alice.signingPair.privateKey,
      );
      const actual = await service.validateSignature(
        aliceOneTimePubKeySignature,
        alice.oneTimePair.publicKey,
        alice.signingPair.publicKey,
      );

      expect(actual).toBe(true);
    });
  });

  // describe('generate channel key from shared secret', () => {

  // });

  xdescribe('plain -> encrypt -> decrypt; end-to-end flow.', () => {
    let alice: TestSubject;
    let bob: TestSubject;

    const secretMessage = 'Up yours, Bob.';
    const plain = Buffer.from(secretMessage);

    beforeAll(async () => {
      const testSubjects = await generateAlicenBob();
      alice = testSubjects.alice;
      bob = testSubjects.bob;
    });

    it('.encrypt, given data, a nonce and a key, returns Buffer of data encrypted using chacha20_xor', async () => {
      const anonNonce = await service.generateNonceBuffer(0);

      const actual = await service.encrypt(plain, anonNonce, alice.oneTimePair.publicKey);

      expect(actual).toBeInstanceOf(Buffer);
      expect(actual).toHaveProperty('length', plain.length);
    });

    it('.decrypt, given corresponding public-key, ciphertext and nonce returns Buffer of decrypted data', async () => {
      const anonNonce = await service.generateNonceBuffer(1);
      const cipher = await service.encrypt(plain, anonNonce, bob.oneTimePair.publicKey);

      const actual = await service.decrypt(cipher, anonNonce, bob.oneTimePair.privateKey);

      expect(actual).toBeInstanceOf(Buffer);
      expect(actual).toHaveProperty('length', cipher.length);
      expect(actual.toString('utf8')).toEqual(Buffer.from(secretMessage).toString('utf8'));
      expect(actual.toString('utf8')).toEqual(plain.toString('utf8'));
    });
  });
});
