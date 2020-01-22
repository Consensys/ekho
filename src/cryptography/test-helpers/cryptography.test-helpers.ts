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

/**
 * Fetch a TestHelper for the CryptographyService.
 * @param service CryptographyService instance
 * @returns Object with test helper methods, which themselves wrap cryptography-service methods.
 */
export const getTestHelper = (service: CryptographyService): TestHelper => {
  /**
   * Generate an anonymous signing pair, and one-time pair.
   * @returns Object with signingPair and oneTimePair. Each being a CryptographyPairDto
   */
  const generateAnonKeys = async (): Promise<AnonKeySet> => {
    const signingPair = await service.generateSigningKeyPair();
    const oneTimePair = await service.generateOneUseKeyPair();

    return {
      signingPair,
      oneTimePair,
    };
  };

  /**
   * Generate TestSubjects alice, bob and trudy, each with a distince signing pair and one-time pair and an undefined sharedSecret property.
   * @returns Object with properties alice, bob and trudy. Each a TestSubject.
   */
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

  /**
   * Generate a shared secret and its signature
   * @param yourPublic1time A 32 byte buffer containing 'my public one-time key..
   * @param myPriv1time A 32 byte buffer containing 'your' private one-time key.
   * @param myPrivSigning A 32 byte buffer containing 'my' private signing key.
   * @returns Object with properties secret, and signature, being 'my' shared secret with 'you' and my signature of that secret. Each a Buffer.
   */
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
