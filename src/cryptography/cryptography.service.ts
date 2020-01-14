import { Injectable, Logger } from '@nestjs/common';
import SodiumNative from 'sodium-native';
import { ConfigService, ConfigModule } from '@nestjs/config';
import {CryptographyKeyPairDto } from './dto/cryptography-keypair.dto';



@Injectable()
export class CryptographyService {

    async generateKeyPair(): Promise<CryptographyKeyPairDto> {
        var myPublicKey:Buffer = SodiumNative.sodium_malloc(SodiumNative.crypto_sign_PUBLICKEYBYTES);
        var myPrivateKey:Buffer = SodiumNative.sodium_malloc(SodiumNative.crypto_sign_SECRETKEYBYTES);

        SodiumNative.crypto_sign_keypair(myPublicKey, myPrivateKey);

        const keyPair: CryptographyKeyPairDto = {
        publicKey: myPublicKey,
        privateKey : myPrivateKey,
        }

        return keyPair;
    }
}
