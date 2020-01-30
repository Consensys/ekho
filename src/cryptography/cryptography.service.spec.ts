import { Test, TestingModule } from '@nestjs/testing';
import SodiumNative from 'sodium-native';
import { CryptographyService } from './cryptography.service';
import { CryptographyKeyPairDto } from './dto/cryptography-keypair.dto';
import { getTestHelper, TestSubject } from './test-helpers/cryptography.test-helpers';

describe('CryptographyService', () => {
  let service: CryptographyService;
  let helpers;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptographyService],
    }).compile();

    service = module.get<CryptographyService>(CryptographyService);
    helpers = getTestHelper(service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('can generate cryptographic keys:', () => {
    it('.generateSigningKeyPair should generate a CryptographyKeyPair', async () => {
      const { publicKey, privateKey }: CryptographyKeyPairDto = service.generateSigningKeyPair();

      expect(typeof publicKey).toBe('string');
      expect(Buffer.from(publicKey, 'base64')).toHaveProperty('length', SodiumNative.crypto_sign_PUBLICKEYBYTES);
      expect(typeof privateKey).toBe('string');
      expect(Buffer.from(privateKey, 'base64')).toHaveProperty('length', SodiumNative.crypto_sign_SECRETKEYBYTES);
    });

    it('sequentially generated signing pairs should not be the same', async () => {
      const first: CryptographyKeyPairDto = service.generateSigningKeyPair();
      const second: CryptographyKeyPairDto = service.generateSigningKeyPair();

      expect(first.publicKey).not.toEqual(second.publicKey);
      expect(first.privateKey).not.toEqual(second.privateKey);
    });

    it('.generateOneUseKeyPair should generate a single use key pair', async () => {
      const { publicKey, privateKey }: CryptographyKeyPairDto = service.generateOneUseKeyPair();

      expect(typeof publicKey).toBe('string');
      expect(Buffer.from(publicKey, 'base64')).toHaveProperty('length', SodiumNative.crypto_scalarmult_BYTES);
      expect(typeof privateKey).toBe('string');
      expect(Buffer.from(privateKey, 'base64')).toHaveProperty('length', SodiumNative.crypto_scalarmult_SCALARBYTES);
    });

    it('sequentially generated one-time pairs should not be the same', async () => {
      const first: CryptographyKeyPairDto = service.generateOneUseKeyPair();
      const second: CryptographyKeyPairDto = service.generateOneUseKeyPair();

      expect(first.publicKey).not.toEqual(second.publicKey);
      expect(first.privateKey).not.toEqual(second.privateKey);
    });
  });

  describe('generateSHA256Hash', () => {
    it('should be able to hash shit', async () => {
      const anon = `durrr I'm a bunch of data, lalala.`;
      const actual = service.generateSHA256Hash(anon);

      expect(typeof actual).toBe('string');
      expect(Buffer.from(actual, 'hex')).toHaveProperty('length', SodiumNative.crypto_hash_sha256_BYTES);
    });

    it('hashes should be deterministic', async () => {
      const one = 'the truth shall make ye fret';
      const other = 'the truth shall make ye fret';

      const expected = service.generateSHA256Hash(one);
      const actual = service.generateSHA256Hash(other);

      expect(actual).toEqual(expected);
    });
  });

  describe('generateNonceBuffer', () => {
    it('should return a number as an 8 byte buffer', async () => {
      const anon = 1234;
      const actual = service.generateNonceBuffer(anon);
      const expected = Buffer.alloc(8);
      expected.writeUInt32BE(anon, 0);

      expect(actual).toBeInstanceOf(Buffer);
      expect(actual).toHaveProperty('length', SodiumNative.crypto_stream_chacha20_NONCEBYTES);
      expect(actual.readUInt32BE(0)).toEqual(expected.readUInt32BE(0));
    });
  });

  describe('cryptography service utility functions', () => {
    it('.generateRandomNumber generates a random number between 0 and 0xffffffff', async () => {
      const actual = service.generateRandomNumber();

      expect(typeof actual).toEqual(typeof 1234);
      expect(actual >= 0).toBe(true);
      expect(actual <= 0xffffffff).toBe(true);
    });

    it('.generateRandomBytes generates a 32 byte Buffer of unpredictable bytes', async () => {
      const actual = service.generateRandomBytes();

      expect(actual).toBeInstanceOf(Buffer);
      expect(actual).toHaveProperty('length', 32);
    });

    it('.getZeroedBuffer returns a Buffer of given size with all bits set to zero', async () => {
      const anonLength = 4;
      const expected = Buffer.alloc(anonLength)
        .fill(0)
        .toString('base64');

      const actual = service.getZeroedBuffer(anonLength);

      expect(actual).toBeInstanceOf(Buffer);
      expect(actual).toHaveProperty('length', anonLength);
      expect(actual.toString('utf8')).toHaveLength(anonLength);
      expect(actual.toString('base64')).toEqual(expected);
    });

    it('getRandomisedBuffer returns a Buffer of given size of random bytes', async () => {
      const anonSize = 4;
      const first = service.getRandomisedBuffer(anonSize);
      const second = service.getRandomisedBuffer(anonSize);

      expect(first).toBeInstanceOf(Buffer);
      expect(first).toHaveLength(anonSize);

      expect(second).toBeInstanceOf(Buffer);
      expect(second).toHaveLength(anonSize);

      expect(first.toString('base64')).not.toEqual(second.toString('base64'));
    });
  });

  describe('can generate and validate digital signature', () => {
    let alice: CryptographyKeyPairDto;
    let bob: CryptographyKeyPairDto;

    beforeAll(async () => {
      alice = service.generateSigningKeyPair();
      bob = service.generateSigningKeyPair();
    });

    it('given a data buffer and private signing key,generateSignature generates signature', async () => {
      const anonData = `I'm totally Alice.`;

      const actual = service.generateSignature(anonData, alice.privateKey);

      expect(typeof actual).toBe('string');
      expect(Buffer.from(actual, 'base64')).toHaveProperty('length', SodiumNative.crypto_sign_BYTES);
    });

    it('can validate a signature against expected public key and the expected data', async () => {
      const anonData = `I'm totally Alice.`;

      const signature = service.generateSignature(anonData, alice.privateKey);

      const actual = service.validateSignature(signature, anonData, alice.publicKey);

      expect(actual).toBe(true);
    });

    it('can refuse to validate a signature against expected public key and the wrong data', async () => {
      const expectedData = `I'm totally Alice.`;
      const incorrectData = 'Fascist lies!';

      const signature = service.generateSignature(expectedData, alice.privateKey);

      const actual = service.validateSignature(signature, incorrectData, alice.publicKey);

      expect(actual).toBe(false);
    });

    it('can refuse to validate a signature against wrong public key and the expected data', async () => {
      const expectedData = `I'm totally Alice.`;

      const signature = service.generateSignature(expectedData, alice.privateKey);

      const actual = service.validateSignature(signature, expectedData, bob.publicKey);

      expect(actual).toBe(false);
    });
  });

  describe('generate and verify shared secret', () => {
    let alice: TestSubject;
    let bob: TestSubject;

    beforeAll(async () => {
      const testSubjects = await helpers.generateAlicenBob();
      alice = testSubjects.alice;
      bob = testSubjects.bob;
    });

    it('generate a shared secret from your public and my private one-time keys', async () => {
      const actual = service.generateECDHSharedSecret(bob.oneTimePair.publicKey, alice.oneTimePair.privateKey);

      expect(typeof actual).toBe('string');
      expect(Buffer.from(actual, 'base64')).toHaveProperty('length', SodiumNative.crypto_scalarmult_BYTES);
    });

    it('independently generated shared secret should be common when two users exchanged public one-time keys', async () => {
      const aliceSharedSecret = service.generateECDHSharedSecret(
        bob.oneTimePair.publicKey,
        alice.oneTimePair.privateKey,
      );
      const bobSharedSecret = service.generateECDHSharedSecret(alice.oneTimePair.publicKey, bob.oneTimePair.privateKey);

      expect(aliceSharedSecret).toEqual(bobSharedSecret);
    });

    it('should be able to verify signature of a one-time public key', async () => {
      const aliceOneTimePubKeySignature = service.generateSignature(
        alice.oneTimePair.publicKey,
        alice.signingPair.privateKey,
      );
      const actual = service.validateSignature(
        aliceOneTimePubKeySignature,
        alice.oneTimePair.publicKey,
        alice.signingPair.publicKey,
      );

      expect(actual).toBe(true);
    });

    it('two users independently generating signed shared secret should be able to verify each others signature', async () => {
      const aliceOneTimePubKeySignature = service.generateSignature(
        alice.oneTimePair.publicKey,
        alice.signingPair.privateKey,
      );

      const bobOneTimePubKeySignature = service.generateSignature(
        bob.oneTimePair.publicKey,
        bob.signingPair.privateKey,
      );
      const bobValidates = service.validateSignature(
        aliceOneTimePubKeySignature,
        alice.oneTimePair.publicKey,
        alice.signingPair.publicKey,
      );

      const aliceValidates = service.validateSignature(
        bobOneTimePubKeySignature,
        bob.oneTimePair.publicKey,
        bob.signingPair.publicKey,
      );

      expect(bobValidates).toBe(true);
      expect(aliceValidates).toBe(true);
    });
  });

  describe('generate a symmetric key from a shared secret', () => {
    let alice: TestSubject;
    let bob: TestSubject;

    const commonContext = 'ANON_CONTEXT';
    const commonChainId = 1;

    beforeAll(async () => {
      const testSubjects = await helpers.generateAlicenBob();
      alice = testSubjects.alice;
      bob = testSubjects.bob;

      alice.sharedSecret = service.generateECDHSharedSecret(bob.oneTimePair.publicKey, alice.oneTimePair.privateKey);

      bob.sharedSecret = service.generateECDHSharedSecret(alice.oneTimePair.publicKey, bob.oneTimePair.privateKey);
    });

    it(`given
      - a secret,
      - context and
      - numeric chain id,
      a user can generate a symmetric key`, async () => {
      const actual = service.deriveSymmetricKeyfromSecret(alice.sharedSecret, commonChainId, commonContext);

      expect(typeof actual).toBe('string');
      expect(Buffer.from(actual, 'base64')).toHaveProperty('length', 32);
    });

    it('two users can independently generate the same symmetric key by using a shared secret', async () => {
      const aliceSymmetricKey = service.deriveSymmetricKeyfromSecret(alice.sharedSecret, commonChainId, commonContext);
      const bobSymmeticKey = service.deriveSymmetricKeyfromSecret(bob.sharedSecret, commonChainId, commonContext);

      expect(aliceSymmetricKey).toEqual(bobSymmeticKey);
    });

    it('changing the context or nonce breaks the symmetry', async () => {
      const aliceSymmetricKey = service.deriveSymmetricKeyfromSecret(alice.sharedSecret, commonChainId, commonContext);
      const bobSymmeticKey = service.deriveSymmetricKeyfromSecret(bob.sharedSecret, commonChainId + 1, commonContext);

      expect(aliceSymmetricKey).not.toEqual(bobSymmeticKey);
    });
  });

  describe('plain -> encrypt -> decrypt; Basic flow.', () => {
    let alice: TestSubject;
    let bob: TestSubject;

    let symmetricKey: string;

    const secretMessage = 'Up yours, Bob.';

    beforeAll(async () => {
      const testSubjects = await helpers.generateAlicenBob();
      alice = testSubjects.alice;
      bob = testSubjects.bob;

      symmetricKey = service.getZeroedBuffer(32).toString();
    });

    it('.encrypt, given data, a nonce and a key, returns Buffer of data encrypted using chacha20_xor', async () => {
      const anonNonce = 0;

      const actual = service.encrypt(secretMessage, anonNonce, symmetricKey);

      expect(typeof actual).toBe('string');
      expect(actual).toHaveProperty('length', 28);
    });

    it('.decrypt, given corresponding ciphertext and nonce returns Buffer of decrypted data', async () => {
      const anonNonce = 1;
      const cipher = service.encrypt(secretMessage, anonNonce, symmetricKey);

      const actual = service.decrypt(cipher, anonNonce, symmetricKey);

      expect(typeof actual).toBe('string');
      expect(cipher).toHaveProperty('length', 28);
      expect(actual).toEqual(secretMessage);
    });
  });

  describe('users with a common symmetric key can decrypt each others messages once', () => {
    let alice: TestSubject;
    let bob: TestSubject;

    let anonNonce: number;

    const commonContext = 'ANON_CONTEXT';
    const commonChainId = 1;

    const secretMessage = 'I saw Trudy today. She looks fat.';

    beforeAll(async () => {
      anonNonce = 0;

      const testSubjects = await helpers.generateAlicenBob();
      alice = testSubjects.alice;
      bob = testSubjects.bob;

      alice.sharedSecret = service.generateECDHSharedSecret(bob.oneTimePair.publicKey, alice.oneTimePair.privateKey);

      bob.sharedSecret = service.generateECDHSharedSecret(alice.oneTimePair.publicKey, bob.oneTimePair.privateKey);
    });

    it('symmetric key generated from shared secret can be used to encipher and decipher a message', async () => {
      const aliceSymmetricKey = service.deriveSymmetricKeyfromSecret(alice.sharedSecret, commonChainId, commonContext);
      const bobSymmeticKey = service.deriveSymmetricKeyfromSecret(bob.sharedSecret, commonChainId, commonContext);

      const cipher = service.encrypt(secretMessage, anonNonce, aliceSymmetricKey);

      const actual = service.decrypt(cipher, anonNonce, bobSymmeticKey);

      expect(actual).toEqual(secretMessage);
    });

    it('the enciphered message cannot be read without knowing the nonce', async () => {
      const aliceSymmetricKey = service.deriveSymmetricKeyfromSecret(alice.sharedSecret, commonChainId, commonContext);
      const bobSymmetricKey = service.deriveSymmetricKeyfromSecret(bob.sharedSecret, commonChainId, commonContext);

      const wrongNonce = 1;
      const cipher = service.encrypt(secretMessage, anonNonce, aliceSymmetricKey);

      const actual = service.decrypt(cipher, wrongNonce, bobSymmetricKey);

      expect(actual).not.toEqual(secretMessage);
    });
  });

  describe('cipher generated by one shared secret cannot be decrypted by another', () => {
    let alice: TestSubject;
    let bob: TestSubject;
    let trudy: TestSubject;

    let anonNonce: number;

    const commonContext = 'ANON_CONTEXT';
    const commonChainId = 1;

    let aliceSymmetricKeyWithBob: string;
    let bobSymmetricKeyWithAlice: string;
    let trudySymmetricKeyWithBob: string;

    const secretMessage = 'I saw Trudy today. She looks fat.';

    beforeAll(async () => {
      anonNonce = 0;

      const testSubjects = await helpers.generateAlicenBob();
      alice = testSubjects.alice;
      bob = testSubjects.bob;
      trudy = testSubjects.trudy;

      alice.sharedSecret = service.generateECDHSharedSecret(bob.oneTimePair.publicKey, alice.oneTimePair.privateKey);

      bob.sharedSecret = service.generateECDHSharedSecret(alice.oneTimePair.publicKey, bob.oneTimePair.privateKey);

      aliceSymmetricKeyWithBob = service.deriveSymmetricKeyfromSecret(alice.sharedSecret, commonChainId, commonContext);

      bobSymmetricKeyWithAlice = service.deriveSymmetricKeyfromSecret(bob.sharedSecret, commonChainId, commonContext);
    });

    it('symmetric keys generating using different shared secrets do not collide', async () => {
      const bobOneTimePairForTrudy = service.generateOneUseKeyPair();
      const trudySharedSecretWithBob = service.generateECDHSharedSecret(
        bobOneTimePairForTrudy.publicKey,
        trudy.oneTimePair.privateKey,
      );

      trudySymmetricKeyWithBob = service.deriveSymmetricKeyfromSecret(
        trudySharedSecretWithBob,
        commonChainId,
        commonContext,
      );

      expect(aliceSymmetricKeyWithBob).toEqual(bobSymmetricKeyWithAlice);
      expect(bobSymmetricKeyWithAlice).not.toEqual(trudySymmetricKeyWithBob);
    });

    it(`Bob has:
        - a shared secret with alice,
        - a shared secret generated from a different one-time pair with trudy.
        - Trudy knows the context and nonce alice and bob used to send their message
      Trudy cannot decrypt a message from alice to bob using her symmetric key with bob, even knowing the correct context and nonce`, async () => {
      const aliceToBob = service.encrypt(secretMessage, anonNonce, aliceSymmetricKeyWithBob);

      const actual = service.decrypt(aliceToBob, anonNonce, trudySymmetricKeyWithBob);

      expect(actual).not.toEqual(secretMessage);
    });

    it(`Bob has also used the same one-time key to generate a shared secret with Trudy as with Alice.
      Trudy know the context and message nonce Alice and Bob used to send the last message.
      Trudy still cannot decrypt the message from Alice to Bob. `, async () => {
      const weakestBobSharedSecretWithTrudy = service.generateECDHSharedSecret(
        trudy.oneTimePair.publicKey,
        bob.oneTimePair.privateKey,
      );

      const trudySymmetricWithBobWeakest = service.deriveSymmetricKeyfromSecret(
        weakestBobSharedSecretWithTrudy,
        commonChainId,
        commonContext,
      );

      const aliceToBob = service.encrypt(secretMessage, anonNonce, aliceSymmetricKeyWithBob);

      const actual = service.decrypt(aliceToBob, anonNonce, trudySymmetricWithBobWeakest);

      expect(actual).not.toEqual(secretMessage);
    });
  });
});
