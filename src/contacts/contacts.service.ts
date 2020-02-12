import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CryptographyKeyPairDto } from 'src/cryptography/dto/cryptography-keypair.dto';
import { User } from 'src/users/entities/users.entity';
import { Repository } from 'typeorm';
import { CryptographyService } from '../cryptography/cryptography.service';
import { UsersService } from '../users/users.service';
import { Contact } from './contacts.entity';
import ContactHandshakeDto from './dto/contact-handshake.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactsRepository: Repository<Contact>,
    private readonly cryptographyService: CryptographyService,
    private readonly usersService: UsersService,
  ) {}

  async createContact(userId: number, name: string): Promise<Contact> {
    const user = await this.usersService.findById(userId, true);
    const oneUseKeyPair: CryptographyKeyPairDto = this.cryptographyService.generateOneUseKeyPair();
    const contact = new Contact();
    contact.name = name;
    contact.user = user;
    contact.handshakePrivateKey = oneUseKeyPair.privateKey;
    contact.handshakePublicKey = oneUseKeyPair.publicKey;
    return this.contactsRepository.save(contact);
  }

  async getByUser(userId: number): Promise<Contact[]> {
    return this.contactsRepository.find({
      select: ['name'],
      where: { user: { id: userId } },
    });
  }

  async findOne(userId: number, name: string, orFail = false): Promise<Contact> {
    if (orFail) {
      return this.contactsRepository.findOneOrFail({ where: { user: { id: userId }, name } });
    } else {
      return this.contactsRepository.findOne({ where: { user: { id: userId }, name } });
    }
  }

  async findAll(): Promise<Contact[]> {
    return this.contactsRepository.find();
  }

  async findOneContact(userId: number, contactId: number): Promise<Contact> {
    return this.contactsRepository.findOneOrFail({
      where: { id: contactId, user: userId },
    });
  }

  async findOneOrCreate(userId: number, name: string): Promise<Contact> {
    const contact = await this.contactsRepository.findOne({ where: { user: { id: userId }, name } });
    if (contact) {
      return contact;
    } else {
      return this.createContact(userId, name);
    }
  }

  async delete(name: string): Promise<void> {
    await this.contactsRepository.delete({ name });
  }

  async initHandshake(userId: number, contactName: string): Promise<ContactHandshakeDto> {
    const contact = await this.findOneOrCreate(userId, contactName);
    return this.generateHandshake(userId, contact);
  }

  async acceptInitHandshake(userId: number, contactName: string, handshake: ContactHandshakeDto): Promise<void> {
    const contact = await this.findOneOrCreate(userId, contactName);
    await this.receiveHandshake(contact, handshake);
  }

  async replyHandshake(userId: number, name: string): Promise<ContactHandshakeDto> {
    const contact = await this.contactsRepository.findOneOrFail({ where: { user: { id: userId }, name } });
    return this.generateHandshake(userId, contact);
  }

  async acceptReplyHandshake(userId: number, name: string, handshake: ContactHandshakeDto): Promise<void> {
    const contact = await this.contactsRepository.findOneOrFail({ where: { user: { id: userId }, name } });
    await this.receiveHandshake(contact, handshake);
  }

  private async generateHandshake(userId: number, contact: Contact): Promise<ContactHandshakeDto> {
    const user: User = await this.usersService.findById(userId);
    const signature = this.cryptographyService.generateSignature(contact.handshakePublicKey, user.privateSigningKey);
    const contactHandshake = new ContactHandshakeDto();
    contactHandshake.identifier = contact.identifier;
    contactHandshake.oneuseKey = contact.handshakePublicKey;
    contactHandshake.signingKey = user.publicSigningKey;
    contactHandshake.signature = signature;

    return contactHandshake;
  }

  private async receiveHandshake(contact: Contact, handshake: ContactHandshakeDto): Promise<void> {
    contact.identifier = handshake.identifier;
    contact.signingKey = handshake.signingKey;
    contact.oneuseKey = handshake.oneuseKey;
    contact.signature = handshake.signature;

    // verify signature
    if (!this.cryptographyService.validateSignature(contact.signature, contact.oneuseKey, contact.signingKey)) {
      throw Error('signature mismatch');
    }

    await this.contactsRepository.save(contact);
  }
}
