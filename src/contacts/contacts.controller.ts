import { Controller, Get, Logger, Post } from '@nestjs/common';
import { CryptographyService } from '../cryptography/cryptography.service';
import { User } from '../users/entities/users.entity';
import { UsersService } from '../users/users.service';
import { ContactsService } from './contacts.service';

@Controller('contacts')
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly usersService: UsersService,
    private readonly cryptographyService: CryptographyService,
  ) {}

  @Get('/dummy')
  async dummy(): Promise<void> {
    const swallow = async fn => {
      try {
        await fn();
      } catch (e) {
        /*swallow exception*/
      }
    };
    swallow(() => this.usersService.delete('bob'));
    swallow(() => this.usersService.delete('alice'));
    swallow(() => this.contactsService.delete('bob'));
    swallow(() => this.contactsService.delete('alice'));

    const createUser = async name => {
      await this.usersService.create({ name });
      const user: User = await this.usersService.find(name);
      Logger.debug(`NewUser={${JSON.stringify(user)}`, name);
      return user;
    };

    const bob: User = await createUser('bob');
    const alice: User = await createUser('alice');

    // bob creates contact for alice
    await this.contactsService.sendHandshake(bob.uuid, alice.uuid);

    const printContact = async (user: User) => {
      const contact = await this.contactsService.findOneByName(user.uuid);
      Logger.debug(`NewContact=${JSON.stringify(contact)}`, user.name);
      const masterSecret = await this.cryptographyService.generateECDHSharedSecret(
        contact.oneuseKey,
        contact.handshakePrivateKey,
      );
      Logger.debug(`masterSecret=${masterSecret.toString('base64')}`, user.name);
    };

    printContact(bob);
    printContact(alice);
  }

  @Post('send-handshake')
  async sendHandshake(from: string, to: string): Promise<void> {
    await this.contactsService.sendHandshake(from, to);
  }
}
