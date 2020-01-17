import { CryptographyService } from '../cryptography.service';
import { CryptographyKeyPairDto } from '../dto/cryptography-keypair.dto';

export interface TestSubject {
  signingPair: CryptographyKeyPairDto;
  oneTimePair: CryptographyKeyPairDto;
  sharedSecret?: SignedSharedSecret;
}

export interface SignedSharedSecret {
  secret: Buffer;
  signature: Buffer;
}

export const getTestHelper = (service: CryptographyService) => {
  const generateAnonKeys = async () => {
    const signingPair = await service.generateSigningKeyPair();
    const oneTimePair = await service.generateOneUseKeyPair();

    return {
      signingPair,
      oneTimePair,
    };
  };

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
