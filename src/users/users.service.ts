import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CryptographyKeyPairDto } from 'src/cryptography/dto/cryptography-keypair.dto';
import { Repository } from 'typeorm';
import { CryptographyService } from '../cryptography/cryptography.service';
import CreateUserDto from './dto/create-user.dto';
import UserDto from './dto/user.dto';
import { User } from './users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cryptoService: CryptographyService,
  ) {}

  async create(user: CreateUserDto): Promise<void> {
    const newUser = new User();
    newUser.name = user.name;
    let SigningKey: CryptographyKeyPairDto;
    SigningKey = await this.cryptoService.generateSigningKeyPair();
    newUser.privateSigningKey = SigningKey.privateKey;
    newUser.publicSigningKey = SigningKey.publicKey;
    await this.userRepository.save(newUser);
  }

  async findByName(name: string): Promise<UserDto> {
    return this.userRepository.findOne({
      select: ['name'],
      where: { name },
    });
  }

  async e2eflow(): Promise<boolean> {
    // create user
    const userSigningKeyPair: CryptographyKeyPairDto = await this.cryptoService.generateSigningKeyPair();
    const userOneUseKeyPair: CryptographyKeyPairDto = await this.cryptoService.generateOneUseKeyPair();
    const userOneTimeKeySignature: Buffer = await this.cryptoService.generateSignature(userOneUseKeyPair.publicKey, userSigningKeyPair.privateKey);

    Logger.debug('User created');

    // create contact
    const contactSigningKeyPair: CryptographyKeyPairDto = await this.cryptoService.generateSigningKeyPair();
    const contactOneUseKeyPair: CryptographyKeyPairDto = await this.cryptoService.generateOneUseKeyPair();
    let contactOneTimeKeySignature: Buffer;
    contactOneTimeKeySignature = await this.cryptoService.generateSignature(contactOneUseKeyPair.publicKey, contactSigningKeyPair.privateKey);

    Logger.debug('Contact created');

    // validate signature and create user master secret
    let userSharedSecret: Buffer;
    if (await this.cryptoService.validateSignature(contactOneTimeKeySignature, contactOneUseKeyPair.publicKey, contactSigningKeyPair.publicKey)) {
        Logger.debug('Contact one use key validated');
        userSharedSecret = await this.cryptoService.generateECDHSharedSecret(contactOneUseKeyPair.publicKey, userOneUseKeyPair.publicKey);
        Logger.debug('Shared Secret(User): ', userSharedSecret.toString('base64'));
    }

    // validate signature and create contact master secret
    let contactSharedSecret: Buffer;
    if (await this.cryptoService.validateSignature(userOneTimeKeySignature, userOneUseKeyPair.publicKey, userSigningKeyPair.publicKey)) {
        Logger.debug('User one use key validated');
        contactSharedSecret = await this.cryptoService.generateECDHSharedSecret(userOneUseKeyPair.publicKey, contactOneUseKeyPair.publicKey);
        Logger.debug('Shared Secret(Contact): ', contactSharedSecret.toString('base64'));
    }

    // create user outbound message chain key
    let ChainKeyId: number = 1; // nothing special about this number for the chain key derivation, we just need a deterministic nonce
    let context: string = 'CHAIN_KEY'; // nothing special about this magic text, as long as it's the same on both sides :)
    let userOutboundChainKey: Buffer = await this.cryptoService.deriveSymmetricKeyfromSecret(userSharedSecret, ChainKeyId, context);
    Logger.debug('User Outbound Message Chain Key created: ', userOutboundChainKey.toString('base64'));

    // create contact inbound message chain key
    ChainKeyId = 1;
    context = 'CHAIN_KEY';
    const contactInboundChainKey: Buffer = await this.cryptoService.deriveSymmetricKeyfromSecret(userSharedSecret, ChainKeyId, context);
    Logger.debug('Contact Inbound Message Chain Key created: ', contactInboundChainKey.toString('base64'));

    // create channel key (user)
    const userChannelKeyPreImage: Buffer = Buffer.from(userSharedSecret.toString('base64') + userSharedSecret.toString('base64'));
    const userChannelKey = await this.cryptoService.generateSHA256Hash(userChannelKeyPreImage);
    Logger.debug('Channel Key (User) created: ' + userChannelKey.toString('base64') + '\n');

    // create contact outbound message chain key
    ChainKeyId = 1;
    context = 'CHAIN_KEY';
    const contactOutboundChainKey: Buffer = await this.cryptoService.deriveSymmetricKeyfromSecret(contactSharedSecret, ChainKeyId, context);
    Logger.debug('Contact Outbound Message Chain Key created: ', contactOutboundChainKey.toString('base64'));

    // create user inbound message chain key
    context = 'CHAIN_KEY';
    let userInboundChainKey: Buffer = await this.cryptoService.deriveSymmetricKeyfromSecret(contactSharedSecret, ChainKeyId, context);
    Logger.debug('User Inbound Message Chain Key created: ', userInboundChainKey.toString('base64'));

    // create channel key (contact)
    // create channel key (user)
    const contactChannelKeyPreImage: Buffer = Buffer.from(contactSharedSecret.toString('base64') + contactSharedSecret.toString('base64'));
    const contactChannelKey = await this.cryptoService.generateSHA256Hash(contactChannelKeyPreImage);
    Logger.debug('Channel Key (Contact) created: ' + contactChannelKey.toString('base64') + '\n');

    // **********************************************************/
    // create a message 0 from user to contact
    let userMessageNonce: number = 0;
    let userMessage: string = 'Msg 0 - user to contact João';
    let message: Buffer = Buffer.from(userMessage, 'utf8');

    Logger.debug('User Message 0 to contact: ', userMessage);

    // create the channel identifier
    let userChannelIdentifierPreImage: string;
    userChannelIdentifierPreImage = userSigningKeyPair.publicKey.toString('base64'); // user public key
    userChannelIdentifierPreImage = userChannelIdentifierPreImage.concat(userChannelKey.toString('base64')); // user channel key
    userChannelIdentifierPreImage = userChannelIdentifierPreImage.concat(String(userMessageNonce)); // message nonce
    let userChannelIdentifier: Buffer = await this.cryptoService.generateSHA256Hash(Buffer.from(userChannelIdentifierPreImage));
    Logger.debug('User Message 0 Channel Identifier: ', userChannelIdentifier.toString('base64'));

    // create the message key
    const MessageKeyRatchet: number = 1;
    const ChainKeyRatchet: number = 2;
    let userMessageKeyPreImage: string = userOutboundChainKey.toString('base64') + String(MessageKeyRatchet);
    let userMessageKey: Buffer = await this.cryptoService.generateSHA256Hash(Buffer.from(userMessageKeyPreImage));
    Logger.debug('User Message 0 Encryption Key: ', userMessageKey.toString('base64'));

    // encrypt the message
    let userMessageEncryptNonce: Buffer = await this.cryptoService.generateNonceBuffer(userMessageNonce);
    let userEncryptedMessage: Buffer = await this.cryptoService.encrypt(message, userMessageEncryptNonce, userMessageKey);

    // ratchet the user outbound message chain key (for perfect forward secrecy)
    const userOutboundChainKeyNew: string = userOutboundChainKey.toString('base64') + ChainKeyRatchet;
    userOutboundChainKey = await this.cryptoService.generateSHA256Hash(Buffer.from(userOutboundChainKeyNew));

    // sign the encrypted message with the user signing key
    let userEncryptedMessageSignature: Buffer = await this.cryptoService.generateSignature(userEncryptedMessage, userSigningKeyPair.privateKey);
    Logger.debug('User Message 0 Encrypted Message Signature: ', userEncryptedMessageSignature.toString('base64'));

    // **********************************************************/
    // receive a message 0 by contact from user
    // create the expected channel identifier
    let userExpectedMessageNonce: number = 0;
    let userExpectedChannelIdentifierPreImage: Buffer = Buffer.from(userSigningKeyPair.publicKey.toString('base64') + contactChannelKey.toString('base64') + String(userExpectedMessageNonce));
    let userExpectedChannelIdentifier: Buffer = await this.cryptoService.generateSHA256Hash(userExpectedChannelIdentifierPreImage);
    Logger.debug('Contact expects user message 0 Channel Identifier: ', userExpectedChannelIdentifier.toString('base64'));

    // calculate the expected message key from the user inbound chain key
    let userExpectedMessageKeyPreImage: Buffer = Buffer.from(userInboundChainKey.toString('base64') + String(MessageKeyRatchet));
    let userExpectedMessageKey: Buffer = await this.cryptoService.generateSHA256Hash(userExpectedMessageKeyPreImage);
    Logger.debug('Contact expects user message 0 Encryption Key: ', userExpectedMessageKey.toString('base64'));

    // ratchet the user inbound chain key
    let userInboundChainKeyPreImage: Buffer = Buffer.from(userInboundChainKey.toString('base64') + String(ChainKeyRatchet));
    userInboundChainKey = await this.cryptoService.generateSHA256Hash(userInboundChainKeyPreImage);

    // validate the signature of the encrypted message
    let validExpectedUserMessage: boolean;
    validExpectedUserMessage = await this.cryptoService.validateSignature(userEncryptedMessageSignature, userEncryptedMessage, userSigningKeyPair.publicKey);
    if (validExpectedUserMessage) {
        Logger.debug('Valid signed encrypted message 0.');

        // decrypt the message 0 with the message key
        const userExpectedEncryptMessageNonce: Buffer = await this.cryptoService.generateNonceBuffer(userExpectedMessageNonce);
        const userDecryptedMessage: Buffer = await this.cryptoService.decrypt(userEncryptedMessage, userExpectedEncryptMessageNonce, userExpectedMessageKey);
        Logger.debug('User Message 0 decrypted message: ', userDecryptedMessage.toString('utf8'));
    }

    // **********************************************************/
    // send another message from the user
    userMessageNonce++;
    userMessage = 'Msg 1 - 日 <- japanese character that looks like a bookshelf';
    message = Buffer.from(userMessage, 'utf8');

    Logger.debug('User Message 1 to contact: ', userMessage);

    // create the channel identifier
    userChannelIdentifierPreImage = userSigningKeyPair.publicKey.toString('base64') + userChannelKey.toString('base64') + String(userMessageNonce);
    userChannelIdentifier = await this.cryptoService.generateSHA256Hash(Buffer.from(userChannelIdentifierPreImage));
    Logger.debug('User Message 1 Channel Identifier: ', userChannelIdentifier.toString('base64'));

    // create the message key
    userMessageKeyPreImage = userOutboundChainKey.toString('base64') + String(MessageKeyRatchet);
    userMessageKey = await this.cryptoService.generateSHA256Hash(Buffer.from(userMessageKeyPreImage));
    Logger.debug('User Message 1 Encryption Key: ', userMessageKey.toString('base64'));

    // encrypt the message
    userMessageEncryptNonce = await this.cryptoService.generateNonceBuffer(userMessageNonce);
    userEncryptedMessage = await this.cryptoService.encrypt(message, userMessageEncryptNonce, userMessageKey);

    // ratchet the user outbound message chain key (for perfect forward secrecy)
    userOutboundChainKey = await this.cryptoService.generateSHA256Hash(Buffer.from(userOutboundChainKey.toString('base64') + String(ChainKeyRatchet)));

    // sign the encrypted message with the user signing key
    userEncryptedMessageSignature = await this.cryptoService.generateSignature(userEncryptedMessage, userSigningKeyPair.privateKey);
    Logger.debug('User Message 1 Encrypted Message Signature: ', userEncryptedMessageSignature.toString('base64'));

    // **********************************************************/
    // receive a message 1 by contact from user
    // create the expected channel identifier
    userExpectedMessageNonce++;
    userExpectedChannelIdentifierPreImage = Buffer.from(userSigningKeyPair.publicKey.toString('base64') + contactChannelKey.toString('base64') + String(userExpectedMessageNonce));
    userExpectedChannelIdentifier = await this.cryptoService.generateSHA256Hash(userExpectedChannelIdentifierPreImage);
    Logger.debug('Contact expects user message 1 Channel Identifier: ', userExpectedChannelIdentifier.toString('base64'));

    // calculate the expected message key from the user inbound chain key
    userExpectedMessageKeyPreImage = Buffer.from(userInboundChainKey.toString('base64') + String(MessageKeyRatchet));
    userExpectedMessageKey = await this.cryptoService.generateSHA256Hash(userExpectedMessageKeyPreImage);
    Logger.debug('Contact expects user message 1 Encryption Key: ', userExpectedMessageKey.toString('base64'));

    // ratchet the user inbound chain key
    userInboundChainKeyPreImage = Buffer.from(userInboundChainKey.toString('base64') + String(ChainKeyRatchet));
    userInboundChainKey = await this.cryptoService.generateSHA256Hash(userInboundChainKeyPreImage);

    // validate the signature of the encrypted message
    validExpectedUserMessage = await this.cryptoService.validateSignature(userEncryptedMessageSignature, userEncryptedMessage, userSigningKeyPair.publicKey);
    if (validExpectedUserMessage) {
        Logger.debug('Valid signed encrypted message 1.');

        // decrypt the message 0 with the message key
        const userExpectedEncryptMessageNonce: Buffer = await this.cryptoService.generateNonceBuffer(userExpectedMessageNonce);
        const userDecryptedMessage: Buffer = await this.cryptoService.decrypt(userEncryptedMessage, userExpectedEncryptMessageNonce, userExpectedMessageKey);
        Logger.debug('User Message 1 decrypted message: ', userDecryptedMessage.toString('utf8'));
    }
    return true;
  }
}
