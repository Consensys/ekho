import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { CryptographyService } from '../cryptography/cryptography.service';
import { CryptographyKeyPairDto } from '../cryptography/dto/cryptography-keypair.dto';
import { User } from '../users/entities/users.entity';
import { UsersService } from '../users/users.service';
import { Contact } from './contacts.entity';
import ContactHandshakeDto from './dto/contact-handshake.dto';

const ENCODING = 'base64';
@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactsRepository: Repository<Contact>,
    private readonly cryptographyService: CryptographyService,
    private readonly usersService: UsersService,
  ) {}

  async createContact(to: string): Promise<Contact> {
    const contact = await this.newContact();
    contact.name = to;
    contact.identifier = Buffer.from('random-uuid');

    return this.contactsRepository.save(contact);
  }

  async findOne(findClause: FindOneOptions<Contact>): Promise<Contact> {
    return this.contactsRepository.findOneOrFail(findClause);
  }

  async findOneByName(name: string): Promise<Contact> {
    return this.findOne({ where: { name } });
  }

  async findOneById(id: number): Promise<Contact> {
    return this.findOne({ where: { id } });
  }

  async findOneOrCreate(to: string): Promise<Contact> {
    const contact = await this.contactsRepository.findOne({ where: { name: to } });
    if (contact) {
      return contact;
    } else {
      return this.createContact(to);
    }
  }

  async delete(name: string): Promise<void> {
    await this.contactsRepository.delete({ name });
  }

  async sendHandshake(from: string, to: string): Promise<void> {
    const fromUser: User = await this.usersService.findByUuid(from);
    const contact = await this.findOneOrCreate(to);
    const signature = await this.cryptographyService.generateSignature(
      contact.handshakePublicKey,
      fromUser.privateSigningKey,
    );
    const contactHandshake = new ContactHandshakeDto();
    contactHandshake.from = from;
    contactHandshake.to = to;
    contactHandshake.identifier = contact.identifier.toString(ENCODING);
    contactHandshake.oneuseKey = contact.handshakePublicKey.toString(ENCODING);
    contactHandshake.signingKey = fromUser.publicSigningKey.toString(ENCODING);
    contactHandshake.signature = signature.toString(ENCODING);

    // TODO: working on single node for now; needs to support multi-node
    const handshakeResult = await this.receiveHandshake(contactHandshake);

    // complete with handshake reply info
    contact.oneuseKey = Buffer.from(handshakeResult.oneuseKey, ENCODING);
    contact.signingKey = Buffer.from(handshakeResult.signingKey, ENCODING);
    contact.signature = Buffer.from(handshakeResult.signature, ENCODING);

    // validate signature
    if (!(await this.cryptographyService.validateSignature(contact.signature, contact.oneuseKey, contact.signingKey))) {
      throw Error('signature mismatch');
    }

    await this.contactsRepository.save(contact);
  }

  async receiveHandshake(handshake: ContactHandshakeDto): Promise<ContactHandshakeDto> {
    const contact = await this.newContact();
    contact.name = handshake.from;
    contact.identifier = Buffer.from(handshake.identifier, ENCODING);
    contact.signingKey = Buffer.from(handshake.signingKey, ENCODING);
    contact.oneuseKey = Buffer.from(handshake.oneuseKey, ENCODING);
    contact.signature = Buffer.from(handshake.signature, ENCODING);

    // verify signature
    if (!(await this.cryptographyService.validateSignature(contact.signature, contact.oneuseKey, contact.signingKey))) {
      throw Error('signature mismatch');
    }

    const to: User = await this.usersService.findByUuid(handshake.to);
    await this.contactsRepository.save(contact);

    // reply handshake with the corresponding data
    const signature = await this.cryptographyService.generateSignature(
      contact.handshakePublicKey,
      to.privateSigningKey,
    );
    const replyHandshake = new ContactHandshakeDto();
    replyHandshake.identifier = handshake.identifier;
    replyHandshake.oneuseKey = contact.handshakePublicKey.toString(ENCODING);
    replyHandshake.signingKey = to.publicSigningKey.toString(ENCODING);
    replyHandshake.signature = signature.toString(ENCODING);

    return replyHandshake;
  }

  private async newContact(): Promise<Contact> {
    const oneUseKeyPair: CryptographyKeyPairDto = await this.cryptographyService.generateOneUseKeyPair();
    const contact = new Contact();
    contact.handshakePrivateKey = oneUseKeyPair.privateKey;
    contact.handshakePublicKey = oneUseKeyPair.publicKey;
    return contact;
  }
}
