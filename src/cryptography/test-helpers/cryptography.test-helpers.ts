import { CryptographyService } from '../cryptography.service';
import { CryptographyKeyPairDto } from '../dto/cryptography-keypair.dto';

export interface AnonKeySet {
  signingPair: CryptographyKeyPairDto;
  oneTimePair: CryptographyKeyPairDto;
}

export interface TestSubject extends AnonKeySet {
  signingPair: CryptographyKeyPairDto;
  oneTimePair: CryptographyKeyPairDto;
  sharedSecret?: Buffer;
}

export interface SignedSharedSecret {
  secret: Buffer;
  signature: Buffer;
}

export interface TestUsers {
  alice: TestSubject;
  bob: TestSubject;
  trudy: TestSubject;
}

export interface TestHelper {
  generateAnonKeys(): Promise<AnonKeySet>;
  generateAlicenBob(): Promise<TestUsers>;
  generateSharedSecret(
    yourPublicOneTimeKey: Buffer,
    myPrivateOneTimeKey: Buffer,
    myPrivateSigningKey: Buffer,
  ): Promise<SignedSharedSecret>;
}

export const getTestHelper = (service: CryptographyService): TestHelper => {
  const generateAnonKeys = async (): Promise<AnonKeySet> => {
    const signingPair = await service.generateSigningKeyPair();
    const oneTimePair = await service.generateOneUseKeyPair();

    return {
      signingPair,
      oneTimePair,
    };
  };

  const generateAlicenBob = async (): Promise<TestUsers> => {
    const alice = await generateAnonKeys();
    const bob = await generateAnonKeys();
    const trudy = await generateAnonKeys();
    return {
      alice,
      bob,
      trudy,
    };
  };

  const generateSharedSecret = async (
    yourPublic1time: Buffer,
    myPriv1time: Buffer,
    myPrivSigning: Buffer,
  ): Promise<SignedSharedSecret> => {
    const secret = await service.generateECDHSharedSecret(yourPublic1time, myPriv1time);
    const signature = await service.generateSignature(secret, myPrivSigning);

    return { signature, secret };
  };

  return {
    generateAnonKeys,
    generateAlicenBob,
    generateSharedSecret,
  };
};
