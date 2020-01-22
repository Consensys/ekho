import { Test, TestingModule } from '@nestjs/testing';

import { CryptographyService } from '../cryptography.service';
import * as CryptoTestHelper from './cryptography.test-helpers';

describe('Cryptography test-helpers', () => {
  let service: CryptographyService;
  let helper: CryptoTestHelper.TestHelper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptographyService],
    }).compile();

    service = module.get<CryptographyService>(CryptographyService);
    helper = CryptoTestHelper.getTestHelper(service);
  });

  it('.generateAnonKeys an object with a new signing pair, and a new one-time pair ', async () => {
    const actual = await helper.generateAnonKeys();

    expect(actual).toHaveProperty('signingPair');
    expect(actual).toHaveProperty('oneTimePair');
    expect(actual.signingPair).toHaveProperty('publicKey');
    expect(actual.signingPair).toHaveProperty('privateKey');
    expect(actual.oneTimePair).toHaveProperty('publicKey');
    expect(actual.oneTimePair).toHaveProperty('privateKey');
  });

  it('.generateAlicenBob returns an object with TestSubjects alice, bob and trudy', async () => {
    const actual = await helper.generateAlicenBob();

    expect(actual).toHaveProperty('alice');
    expect(actual).toHaveProperty('bob');
    expect(actual).toHaveProperty('trudy');

    expect(actual.alice).toHaveProperty('signingPair');
    expect(actual.alice).toHaveProperty('oneTimePair');

    expect(actual.bob).toHaveProperty('signingPair');
    expect(actual.bob).toHaveProperty('oneTimePair');

    expect(actual.trudy).toHaveProperty('signingPair');
    expect(actual.trudy).toHaveProperty('oneTimePair');
  });

  it('generated test subjects do not have keys in common', async () => {
    const { alice, bob, trudy } = await helper.generateAlicenBob();

    const setOfKeysAsStrings = new Set<string>([
      alice.signingPair.publicKey.toString('base64'),
      alice.signingPair.privateKey.toString('base64'),
      alice.oneTimePair.publicKey.toString('base64'),
      alice.oneTimePair.privateKey.toString('base64'),
      bob.signingPair.publicKey.toString('base64'),
      bob.signingPair.privateKey.toString('base64'),
      bob.oneTimePair.publicKey.toString('base64'),
      bob.oneTimePair.privateKey.toString('base64'),
      trudy.signingPair.publicKey.toString('base64'),
      trudy.signingPair.privateKey.toString('base64'),
      trudy.oneTimePair.publicKey.toString('base64'),
      trudy.oneTimePair.privateKey.toString('base64'),
    ]);

    expect(setOfKeysAsStrings).toHaveProperty('size', 12);
  });

  it(`Given:
  - your one-time public key
  - my one-time private key
  - my private signing key
  .generateSharedSecret returns a sharedSecret, and its signature`, async () => {
    const { alice, bob } = await helper.generateAlicenBob();
    const actual = await helper.generateSharedSecret(
      bob.oneTimePair.publicKey,
      alice.oneTimePair.privateKey,
      alice.signingPair.privateKey,
    );

    expect(actual).toHaveProperty('secret');
    expect(actual.secret).toBeInstanceOf(Buffer);
    expect(actual).toHaveProperty('signature');
    expect(actual.signature).toBeInstanceOf(Buffer);
  });

  it('shared secrets so generated should be common to two users concerned', async () => {
    const { alice, bob } = await helper.generateAlicenBob();
    const aliceSignedSharedSecret = await helper.generateSharedSecret(
      bob.oneTimePair.publicKey,
      alice.oneTimePair.privateKey,
      alice.signingPair.privateKey,
    );
    const bobSignedSharedSecret = await helper.generateSharedSecret(
      alice.oneTimePair.publicKey,
      bob.oneTimePair.privateKey,
      bob.signingPair.privateKey,
    );

    expect(aliceSignedSharedSecret.secret.toString('base64')).toEqual(bobSignedSharedSecret.secret.toString('base64'));
  });
});
