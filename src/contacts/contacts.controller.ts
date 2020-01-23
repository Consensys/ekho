import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CryptographyService } from '../cryptography/cryptography.service';
import { UsersService } from '../users/users.service';
import { ContactsService } from './contacts.service';
import ContactHandshakeDto from './dto/contact-handshake.dto';
import ContactDto from './dto/contact.dto';

@Controller('contacts')
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly usersService: UsersService,
    private readonly cryptographyService: CryptographyService,
  ) {}

  @Get(':userId')
  async getContactsForUser(@Param('userId') userId: number): Promise<ContactDto[]> {
    return this.contactsService.getByUser(userId);
  }

  @Post('generate-init-handshake/:userId/:contactName')
  async initHandshake(
    @Param('userId') userId: number,
    @Param('contactName') contactName: string,
  ): Promise<ContactHandshakeDto> {
    return this.contactsService.initHandshake(userId, contactName);
  }

  @Post('accept-init-handshake/:userId/:contactName')
  async acceptInitHandshake(
    @Param('userId') userId: number,
    @Param('contactName') contactName: string,
    @Body() initHandshake: ContactHandshakeDto,
  ): Promise<void> {
    await this.contactsService.acceptInitHandshake(userId, contactName, initHandshake);
  }

  @Post('generate-reply-handshake/:contactName')
  async generateReplyHandshake(
    @Param('userId') userId: number,
    @Param('contactName') contactName: string,
  ): Promise<ContactHandshakeDto> {
    return this.contactsService.replyHandshake(userId, contactName);
  }

  @Post('accept-reply-handshake/:contactName')
  async acceptReplyHandshake(
    @Param('userId') userId: number,
    @Param('contactName') contactName: string,
    @Body() replyHandshake: ContactHandshakeDto,
  ): Promise<void> {
    await this.contactsService.acceptReplyHandshake(userId, contactName, replyHandshake);
  }

  // Reference for creating a master key (delete when no longer needed)
  // @Get('masterkey-leak-nasty-backdoor-for-poc-purposes/:contactName')
  // async getMasterKey(@Param('userId') userId: number, @Param('contactName') contactName: string) {
  //   const contact = await this.contactsService.findOne(userId, contactName);
  //   const masterSecret = await this.cryptographyService.generateECDHSharedSecret(
  //     contact.oneuseKey,
  //     contact.handshakePrivateKey,
  //   );
  //   return masterSecret.toString('base64');
  // }

  // This could be reused as an end-to-end test
  // @Get('/example')
  // async example(): Promise<void> {
  //   const swallow = async fn => {
  //     try {
  //       await fn();
  //     } catch (e) {
  //       /*swallow exception*/
  //     }
  //   };
  //   swallow(() => this.usersService.delete('bob'));
  //   swallow(() => this.usersService.delete('alice'));
  //   swallow(() => this.contactsService.delete('[contact-name] bob'));
  //   swallow(() => this.contactsService.delete('[contact-name] alice'));

  //   const createUser = async name => {
  //     await this.usersService.create({ name });
  //     const user: User = await this.usersService.find(name);
  //     Logger.debug(`NewUser={${JSON.stringify(user)}`, name);
  //     return user;
  //   };

  //   const bob: User = await createUser('bob');
  //   const alice: User = await createUser('alice');

  //   // bob generate handshake for alice
  //   const bobToAliceHandshake = await this.initHandshake(bob.id, '[contact-name] alice');

  //   // alice accepts hanshake and adds it to her contacts
  //   await this.acceptInitHandshake(alice.id, '[contact-name] bob', bobToAliceHandshake);

  //   // alice generates handshake for bob
  //   const aliceToBobHandshake = await this.generateReplyHandshake(alice.id, '[contact-name] bob');

  //   // bob accepts handshake and adds it to his contacts
  //   await this.acceptReplyHandshake(bob.id, '[contact-name] alice', aliceToBobHandshake);

  //   const printContact = async (user: User, contactName: string) => {
  //     const contact = await this.contactsService.findOne(user.id, contactName, true);
  //     const contactHandshake = {
  //       name: contact.name,
  //       identifier: contact.identifier,
  //       handshakePublicKey: contact.handshakePublicKey.toString('base64'),
  //       handshakePrivateKey: contact.handshakePrivateKey.toString('base64'),
  //       oneuseKey: contact.oneuseKey.toString('base64'),
  //       signingKey: contact.signingKey.toString('base64'),
  //       signature: contact.signature.toString('base64'),
  //     };

  //     Logger.debug(`NewContact=${JSON.stringify(contactHandshake, null, 2)}`, contactName);
  //     const masterSecret = await this.cryptographyService.generateECDHSharedSecret(
  //       contact.oneuseKey,
  //       contact.handshakePrivateKey,
  //     );
  //     const userPubK = user.publicSigningKey.toString('base64');
  //     Logger.debug(
  //       `NewContact PubK matches User PubK? ${
  //         userPubK === contactHandshake.signingKey
  //           ? 'YES!'
  //           : `NOP >> ${userPubK} != ${contactHandshake.handshakePublicKey}`
  //       }`,
  //       contactName,
  //     );
  //     Logger.debug(`masterSecret=${masterSecret.toString('base64')}`, contactName);
  //   };

  //   Logger.debug(await this.contactsService.findAll());
  //   await printContact(alice, '[contact-name] bob');
  //   await printContact(bob, '[contact-name] alice');
  // }
}
