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
      const { publicKey, privateKey }: CryptographyKeyPairDto = await service.generateSigningKeyPair();

      expect(publicKey).toBeInstanceOf(Buffer);
      expect(publicKey).toHaveProperty('length', SodiumNative.crypto_sign_PUBLICKEYBYTES);
      expect(privateKey).toBeInstanceOf(Buffer);
      expect(privateKey).toHaveProperty('length', SodiumNative.crypto_sign_SECRETKEYBYTES);
    });

    it('sequentially generated signing pairs should not be the same', async () => {
      const first: CryptographyKeyPairDto = await service.generateSigningKeyPair();
      const second: CryptographyKeyPairDto = await service.generateSigningKeyPair();

      expect(first.publicKey.toString('base64')).not.toEqual(second.publicKey.toString('base64'));
      expect(first.privateKey.toString('base64')).not.toEqual(second.privateKey.toString('base64'));
    });

    it('.generateOneUseKeyPair should generate a single use key pair', async () => {
      const { publicKey, privateKey }: CryptographyKeyPairDto = await service.generateOneUseKeyPair();

      expect(publicKey).toBeInstanceOf(Buffer);
      expect(publicKey).toHaveProperty('length', SodiumNative.crypto_scalarmult_BYTES);
      expect(privateKey).toBeInstanceOf(Buffer);
      expect(privateKey).toHaveProperty('length', SodiumNative.crypto_scalarmult_SCALARBYTES);
    });

    it('sequentially generated one-time pairs should not be the same', async () => {
      const first: CryptographyKeyPairDto = await service.generateOneUseKeyPair();
      const second: CryptographyKeyPairDto = await service.generateOneUseKeyPair();

      expect(first.publicKey.toString('base64')).not.toEqual(second.publicKey.toString('base64'));
      expect(first.privateKey.toString('base64')).not.toEqual(second.privateKey.toString('base64'));
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

    it('.getZeroedBuffer returns a Buffer of given size with all bits set to zero', async () => {
      const anonLength = 4;
      const expected = Buffer.alloc(anonLength)
        .fill(0)
        .toString('base64');

      const actual = await service.getZeroedBuffer(anonLength);

      expect(actual).toBeInstanceOf(Buffer);
      expect(actual).toHaveProperty('length', anonLength);
      expect(actual.toString('utf8')).toHaveLength(anonLength);
      expect(actual.toString('base64')).toEqual(expected);
    });

    it('getRandomisedBuffer returns a Buffer of given size of random bytes', async () => {
      const anonSize = 4;
      const first = await service.getRandomisedBuffer(anonSize);
      const second = await service.getRandomisedBuffer(anonSize);

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
      const testSubjects = await helpers.generateAlicenBob();
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

    it('two users independently generating signed shared secret should be able to verify each others signature', async () => {
      const aliceOneTimePubKeySignature = await service.generateSignature(
        alice.oneTimePair.publicKey,
        alice.signingPair.privateKey,
      );

      const bobOneTimePubKeySignature = await service.generateSignature(
        bob.oneTimePair.publicKey,
        bob.signingPair.privateKey,
      );
      const bobValidates = await service.validateSignature(
        aliceOneTimePubKeySignature,
        alice.oneTimePair.publicKey,
        alice.signingPair.publicKey,
      );

      const aliceValidates = await service.validateSignature(
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

      alice.sharedSecret = await service.generateECDHSharedSecret(
        bob.oneTimePair.publicKey,
        alice.oneTimePair.privateKey,
      );

      bob.sharedSecret = await service.generateECDHSharedSecret(
        alice.oneTimePair.publicKey,
        bob.oneTimePair.privateKey,
      );
    });

    it(`given
      - a secret,
      - context and
      - numeric chain id,
      a user can generate a symmetric key`, async () => {
      const actual = await service.deriveSymmetricKeyfromSecret(alice.sharedSecret, commonChainId, commonContext);

      expect(actual).toBeInstanceOf(Buffer);
      expect(actual).toHaveProperty('length', 32);
    });

    it('two users can independently generate the same symmetric key by using a shared secret', async () => {
      const aliceSymmetricKey = await service.deriveSymmetricKeyfromSecret(
        alice.sharedSecret,
        commonChainId,
        commonContext,
      );
      const bobSymmeticKey = await service.deriveSymmetricKeyfromSecret(bob.sharedSecret, commonChainId, commonContext);

      expect(aliceSymmetricKey.toString('base64')).toEqual(bobSymmeticKey.toString('base64'));
    });

    it('changing the context or nonce breaks the symmetry', async () => {
      const aliceSymmetricKey = await service.deriveSymmetricKeyfromSecret(
        alice.sharedSecret,
        commonChainId,
        commonContext,
      );
      const bobSymmeticKey = await service.deriveSymmetricKeyfromSecret(
        bob.sharedSecret,
        commonChainId + 1,
        commonContext,
      );

      expect(aliceSymmetricKey.toString('base64')).not.toEqual(bobSymmeticKey.toString('base64'));
    });
  });

  describe('plain -> encrypt -> decrypt; Basic flow.', () => {
    let alice: TestSubject;
    let bob: TestSubject;

    let symmetricKey: Buffer;

    const secretMessage = 'Up yours, Bob.';
    const plain = Buffer.from(secretMessage);

    beforeAll(async () => {
      const testSubjects = await helpers.generateAlicenBob();
      alice = testSubjects.alice;
      bob = testSubjects.bob;

      symmetricKey = await service.generateRandomBytes();
    });

    it('.encrypt, given data, a nonce and a key, returns Buffer of data encrypted using chacha20_xor', async () => {
      const anonNonce = await service.generateNonceBuffer(0);

      const actual = await service.encrypt(plain, anonNonce, symmetricKey);

      expect(actual).toBeInstanceOf(Buffer);
      expect(actual).toHaveProperty('length', plain.length);
    });

    it('.decrypt, given corresponding ciphertext and nonce returns Buffer of decrypted data', async () => {
      const anonNonce = await service.generateNonceBuffer(1);
      const cipher = await service.encrypt(plain, anonNonce, symmetricKey);

      const actual = await service.decrypt(cipher, anonNonce, symmetricKey);

      expect(actual).toBeInstanceOf(Buffer);
      expect(actual).toHaveProperty('length', cipher.length);
      expect(actual.toString('utf8')).toEqual(Buffer.from(secretMessage).toString('utf8'));
      expect(actual.toString('utf8')).toEqual(plain.toString('utf8'));
    });
  });

  describe('users with a common symmetric key can decrypt each others messages once', () => {
    let alice: TestSubject;
    let bob: TestSubject;

    let anonNonce: Buffer;

    const commonContext = 'ANON_CONTEXT';
    const commonChainId = 1;

    const secretMessage = Buffer.from('I saw Trudy today. She looks fat.');

    beforeAll(async () => {
      anonNonce = await service.generateNonceBuffer(0);

      const testSubjects = await helpers.generateAlicenBob();
      alice = testSubjects.alice;
      bob = testSubjects.bob;

      alice.sharedSecret = await service.generateECDHSharedSecret(
        bob.oneTimePair.publicKey,
        alice.oneTimePair.privateKey,
      );

      bob.sharedSecret = await service.generateECDHSharedSecret(
        alice.oneTimePair.publicKey,
        bob.oneTimePair.privateKey,
      );
    });

    it('symmetric key generated from shared secret can be used to encipher and decipher a message', async () => {
      const aliceSymmetricKey = await service.deriveSymmetricKeyfromSecret(
        alice.sharedSecret,
        commonChainId,
        commonContext,
      );
      const bobSymmeticKey = await service.deriveSymmetricKeyfromSecret(bob.sharedSecret, commonChainId, commonContext);

      const cipher = await service.encrypt(secretMessage, anonNonce, aliceSymmetricKey);

      const actual = await service.decrypt(cipher, anonNonce, bobSymmeticKey);

      expect(actual.toString('utf8')).toEqual(secretMessage.toString('utf8'));
    });

    it('the enciphered message cannot be read without knowing the nonce', async () => {
      const aliceSymmetricKey = await service.deriveSymmetricKeyfromSecret(
        alice.sharedSecret,
        commonChainId,
        commonContext,
      );
      const bobSymmetricKey = await service.deriveSymmetricKeyfromSecret(
        bob.sharedSecret,
        commonChainId,
        commonContext,
      );

      const wrongNonce = await service.generateNonceBuffer(1);
      const cipher = await service.encrypt(secretMessage, anonNonce, aliceSymmetricKey);

      const actual = await service.decrypt(cipher, wrongNonce, bobSymmetricKey);

      expect(actual.toString('utf8')).not.toEqual(secretMessage.toString('utf8'));
    });
  });

  describe('cipher generated by one shared secret cannot be decrypted by another', () => {
    let alice: TestSubject;
    let bob: TestSubject;
    let trudy: TestSubject;

    let anonNonce: Buffer;

    const commonContext = 'ANON_CONTEXT';
    const commonChainId = 1;

    let aliceSymmetricKeyWithBob: Buffer;
    let bobSymmetricKeyWithAlice: Buffer;
    let trudySymmetricKeyWithBob: Buffer;

    const secretMessage = Buffer.from('I saw Trudy today. She looks fat.');

    beforeAll(async () => {
      anonNonce = await service.generateNonceBuffer(0);

      const testSubjects = await helpers.generateAlicenBob();
      alice = testSubjects.alice;
      bob = testSubjects.bob;
      trudy = testSubjects.trudy;

      alice.sharedSecret = await service.generateECDHSharedSecret(
        bob.oneTimePair.publicKey,
        alice.oneTimePair.privateKey,
      );

      bob.sharedSecret = await service.generateECDHSharedSecret(
        alice.oneTimePair.publicKey,
        bob.oneTimePair.privateKey,
      );

      aliceSymmetricKeyWithBob = await service.deriveSymmetricKeyfromSecret(
        alice.sharedSecret,
        commonChainId,
        commonContext,
      );

      bobSymmetricKeyWithAlice = await service.deriveSymmetricKeyfromSecret(
        bob.sharedSecret,
        commonChainId,
        commonContext,
      );
    });

    it('symmetric keys generating using different shared secrets do not collide', async () => {
      const bobOneTimePairForTrudy = await service.generateOneUseKeyPair();
      const trudySharedSecretWithBob = await service.generateECDHSharedSecret(
        bobOneTimePairForTrudy.publicKey,
        trudy.oneTimePair.privateKey,
      );

      trudySymmetricKeyWithBob = await service.deriveSymmetricKeyfromSecret(
        trudySharedSecretWithBob,
        commonChainId,
        commonContext,
      );

      expect(aliceSymmetricKeyWithBob.toString('base64')).toEqual(bobSymmetricKeyWithAlice.toString('base64'));
      expect(bobSymmetricKeyWithAlice.toString('base64')).not.toEqual(trudySymmetricKeyWithBob.toString('base64'));
    });

    it(`Bob has:
        - a shared secret with alice,
        - a shared secret generated from a different one-time pair with trudy.
        - Trudy knows the context and nonce alice and bob used to send their message
      Trudy cannot decrypt a message from alice to bob using her symmetric key with bob, even knowing the correct context and nonce`, async () => {
      const aliceToBob = await service.encrypt(secretMessage, anonNonce, aliceSymmetricKeyWithBob);

      const actual = await service.decrypt(aliceToBob, anonNonce, trudySymmetricKeyWithBob);

      expect(actual.toString('utf8')).not.toEqual(secretMessage.toString('utf8'));
    });

    it(`Bob has also used the same one-time key to generate a shared secret with Trudy as with Alice.
      Trudy know the context and message nonce Alice and Bob used to send the last message.
      Trudy still cannot decrypt the message from Alice to Bob. `, async () => {
      const weakestBobSharedSecretWithTrudy = await service.generateECDHSharedSecret(
        trudy.oneTimePair.publicKey,
        bob.oneTimePair.privateKey,
      );

      const trudySymmetricWithBobWeakest = await service.deriveSymmetricKeyfromSecret(
        weakestBobSharedSecretWithTrudy,
        commonChainId,
        commonContext,
      );

      const aliceToBob = await service.encrypt(secretMessage, anonNonce, aliceSymmetricKeyWithBob);

      const actual = await service.decrypt(aliceToBob, anonNonce, trudySymmetricWithBobWeakest);

      expect(actual.toString('utf8')).not.toEqual(secretMessage.toString('utf8'));
    });
  });
});
