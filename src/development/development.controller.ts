import { Controller, Get, Inject, Logger, Param } from '@nestjs/common';
import { ContactsService } from '../contacts/contacts.service';
import { CryptographyService } from '../cryptography/cryptography.service';
import { KeyManager } from '../key-manager/key-manager.interface';
import { User } from '../users/entities/users.entity';
import { UsersService } from '../users/users.service';

@Controller('development')
export class DevelopmentController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly usersService: UsersService,
    private readonly cryptographyService: CryptographyService,
    @Inject('KeyManager')
    private readonly keyManager: KeyManager,
  ) {}

  @Get('generate-master-key/:userId/:contactName')
  async getMasterKey(@Param('userId') userId: number, @Param('contactName') contactName: string): Promise<string> {
    const user: User = await this.usersService.findById(userId);
    const contact = await this.contactsService.findOne(user.id, contactName, true);

    // generate the master key
    return this.cryptographyService.generateECDHSharedSecret(contact.oneuseKey, contact.handshakePrivateKey);
  }

  @Get('contact/:userId/:contactName')
  async getContact(@Param('userId') userId: number, @Param('contactName') contactName: string): Promise<any> {
    const contact = await this.contactsService.findOne(userId, contactName, true);
    const contactHandshake = {
      name: contact.name,
      identifier: contact.identifier,
      handshakePublicKey: contact.handshakePublicKey,
      handshakePrivateKey: contact.handshakePrivateKey,
      oneuseKey: contact.oneuseKey,
      signingKey: contact.signingKey,
      signature: contact.signature,
    };
    Logger.debug(contactHandshake, `[dev] getContact(${userId}, ${contactName})`);
    return contactHandshake;
  }

  @Get('cryptography/verify-signature/:signature/:oneUseKey/:signingKey')
  async verifySignature(
    @Param('signature') signature: string,
    @Param('oneUseKey') oneuseKey: string,
    @Param('signingKey') signingKey: string,
  ): Promise<any> {
    const result = await this.keyManager.verifySignature(signature, oneuseKey, signingKey);
    return { result };
  }
}
