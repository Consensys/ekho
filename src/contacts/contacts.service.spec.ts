import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mockRepository } from '../../test/test-helpers';
import { CryptographyService } from '../cryptography/cryptography.service';
import { getTestHelper, TestHelper } from '../cryptography/test-helpers/cryptography.test-helpers';
import { fakeUser } from '../users/test-helpers/faker';
import { mockUsersService } from '../users/test-helpers/mock-users-service';
import { UsersService } from '../users/users.service';
import { Contact } from './contacts.entity';
import { ContactsService } from './contacts.service';
import ContactHandshakeDto from './dto/contact-handshake.dto';
import { fakeContact, fakeContactHandshake } from './test-helpers/faker';

describe('ContactsService', () => {
  let service: ContactsService;
  let repository: Repository<Contact>;
  let usersService: UsersService;
  let cryptoService: CryptographyService;
  let cryptographyTestHelper: TestHelper;

  let userKeySet;
  let contactKeySet;

  let expectedSignature: Buffer;
  let expectedHandShake: ContactHandshakeDto;

  let anonUser;
  let anonContact: Contact;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        { provide: getRepositoryToken(Contact), useClass: mockRepository },
        CryptographyService,
        { provide: UsersService, useValue: mockUsersService() },
      ],
    }).compile();

    repository = module.get<Repository<Contact>>(getRepositoryToken(Contact));
    service = module.get<ContactsService>(ContactsService);
    usersService = module.get<UsersService>(UsersService);
    cryptoService = module.get<CryptographyService>(CryptographyService);
    cryptographyTestHelper = getTestHelper(cryptoService);

    userKeySet = await cryptographyTestHelper.generateAnonKeys();
    contactKeySet = await cryptographyTestHelper.generateAnonKeys();

    anonUser = fakeUser({
      privateSigningKey: userKeySet.signingPair.privateKey,
      publicSigningKey: userKeySet.signingPair.publicKey,
    });
    anonContact = fakeContact({
      handshakePublicKey: contactKeySet.oneTimePair.publicKey,
      handshakePrivateKey: contactKeySet.oneTimePair.privateKey,
    });

    expectedSignature = await cryptographyTestHelper.sign(anonContact.handshakePublicKey, anonUser.privateSigningKey);

    expectedHandShake = fakeContactHandshake({
      identifier: anonContact.identifier,
      oneuseKey: anonContact.handshakePublicKey.toString('base64'),
      signingKey: anonUser.publicSigningKey.toString('base64'),
      signature: expectedSignature.toString('base64'),
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it(`createContact:
    - delegates UserssService to find a user by a given userId
    - delegates CryptographyService to generate a one-use keypair
    - creates a contact of that user and that one-use keypair. Keypair is used for handshake
    - delegates ContactsRepository to save the Contact.`, async () => {
    const anonKeySet = await cryptographyTestHelper.generateAnonKeys();
    const { oneTimePair } = anonKeySet;

    const expected = new Contact();
    expected.name = anonUser.name;
    expected.user = anonUser;
    expected.handshakePublicKey = oneTimePair.publicKey;
    expected.handshakePrivateKey = oneTimePair.privateKey;

    jest.spyOn(usersService, 'findById').mockResolvedValueOnce(anonUser);
    jest.spyOn(cryptoService, 'generateOneUseKeyPair').mockResolvedValueOnce(oneTimePair);
    jest.spyOn(repository, 'save').mockResolvedValueOnce(expected);

    const actual = await service.createContact(anonUser.id, anonUser.name);

    expect(usersService.findById).toBeCalledTimes(1);
    expect(cryptoService.generateOneUseKeyPair).toBeCalledTimes(1);
    expect(repository.save).toBeCalledTimes(1);
    expect(repository.save).lastCalledWith(expected);

    expect(actual).toBe(expected);
  });

  it('getByUser delegates ContactRepository.find to return a name for each Contact of a given userId', async () => {
    const anonContactNames = ['foo', 'bar'];
    const expected = anonContactNames.map(name => fakeContact({ name, user: anonUser }));

    jest.spyOn(repository, 'find').mockResolvedValueOnce(expected);

    const actual = await service.getByUser(anonUser.id);

    expect(repository.find).toBeCalledTimes(1);
    expect(actual).toBe(expected);
  });

  it(`findOne: returns the first Contact for a given userId and contact name`, async () => {
    const expected = fakeContact({ user: anonUser });

    jest.spyOn(repository, 'findOne').mockResolvedValueOnce(expected);

    const actual = await service.findOne(anonUser.id, expected.name);

    expect(repository.findOne).toBeCalledTimes(1);
    expect(actual).toBe(expected);
  });

  it('findOne has an optional orFail branch which instead throws if there is no such record.', async () => {
    const expected = [];

    jest.spyOn(repository, 'findOneOrFail').mockRejectedValueOnce(expected);

    try {
      const actual = await service.findOne(anonUser.id, 'no-contact-for-this-user-with-this-name', true);
      expect(actual).toBeUndefined();
    } catch (rejection) {
      expect(repository.findOneOrFail).toBeCalledTimes(1);
      expect(rejection).toBe(expected); // ha.
    }
  });

  it('findAll delegates Contacts respository to return all contacts', async () => {
    const anonContactNames = ['foo', 'bar'];
    const expected = anonContactNames.map(name => fakeContact({ name, user: anonUser }));

    jest.spyOn(repository, 'find').mockResolvedValueOnce(expected);

    const actual = await service.findAll();

    expect(repository.find).toBeCalledTimes(1);
    expect(repository.find).lastCalledWith();
    expect(actual).toBe(expected);
  });

  it('findOneOrCreate delegates Contacts repository from find the first contact for a given userId with a given name', async () => {
    const expected = fakeContact({ user: anonUser });

    jest.spyOn(repository, 'findOne').mockResolvedValueOnce(expected);

    const actual = await service.findOneOrCreate(anonUser.id, expected.name);

    expect(repository.findOne).toBeCalledTimes(1);
    expect(actual).toBe(expected);
  });

  it('findOneOrCreate calls service.createContact with the same given userId and contact name if there is no such contact on the repo', async () => {
    const expected = fakeContact({ user: anonUser });

    jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);
    jest.spyOn(service, 'createContact').mockResolvedValueOnce(expected);

    const actual = await service.findOneOrCreate(anonUser.id, expected.name);

    expect(repository.findOne).toBeCalledTimes(1);
    expect(service.createContact).toBeCalledTimes(1);
    expect(service.createContact).lastCalledWith(anonUser.id, expected.name);
    expect(actual).toBe(expected);
  });

  it('delete delegates Contacts repository to delete a record with a given name', async () => {
    const anonContactName = 'meh';
    jest.spyOn(repository, 'delete').mockResolvedValueOnce({ raw: 'nobody-cares' });

    await service.delete(anonContactName);

    expect(repository.delete).toBeCalledTimes(1);
    expect(repository.delete).lastCalledWith({ name: anonContactName });
  });

  it('initHandshake returns a ContactHandshake for a Contact of a given userId with a given name', async () => {
    // We are not populating these properties here.
    const expected = { ...expectedHandShake };
    delete expected.to;
    delete expected.from;

    jest.spyOn(service, 'findOneOrCreate').mockResolvedValue(anonContact);
    jest.spyOn(usersService, 'findById').mockResolvedValueOnce(anonUser);

    const actual = await service.initHandshake(anonUser.id, anonContact.name);

    expect(service.findOneOrCreate).toBeCalledTimes(1);
    expect(usersService.findById).toBeCalledTimes(1);
    expect(usersService.findById).lastCalledWith(anonUser.id);
    expect(actual).toMatchObject(expected);
  });

  it('acceptInitHandshake stores a given valid handshake against the record of a contact with a given name for a given userId', async () => {
    const noHandShakeContact: Contact = { ...anonContact };
    const expected: Contact = { ...noHandShakeContact, ...{ expectedHandShake } };

    jest.spyOn(service, 'findOneOrCreate').mockResolvedValueOnce(expected);
    jest.spyOn(repository, 'save').mockResolvedValueOnce(expected);

    await service.acceptInitHandshake(anonUser.id, anonContact.name, expectedHandShake);

    expect(service.findOneOrCreate).toBeCalledTimes(1);
    expect(repository.save).toBeCalledTimes(1);
    expect(repository.save).lastCalledWith(expected);
  });

  // TODO: Unskip after rebasing on top of keys as Buffer -> string stuff. Getting an anon invalid signature is a nuisance.
  xit(`acceptInitHandshake will instead throw if:
    - CryptographyService.validateSignature cannot validate the signature of the given handshake`, async () => {
    const invalidSignature = 'no-such-signature';
    const invalidHandshake: ContactHandshakeDto = { ...expectedHandShake, ...{ signature: invalidSignature } };

    jest.spyOn(service, 'findOneOrCreate').mockResolvedValueOnce(anonContact);
    jest.spyOn(usersService, 'findById').mockResolvedValueOnce(anonUser);

    try {
      await service.acceptInitHandshake(anonUser.id, anonContact.name, invalidHandshake);
    } catch (e) {
      expect(e).toBe('signature mismatch');
    }
  });

  it(`replyHandshake:
    - returns a ContactHandshakeDto for a contact of a given userId, with a given contact name`, async () => {
    // We are not populating these properties here.
    const expected = { ...expectedHandShake };
    delete expected.to;
    delete expected.from;

    jest.spyOn(repository, 'findOneOrFail').mockResolvedValue(anonContact);
    jest.spyOn(usersService, 'findById').mockResolvedValueOnce(anonUser);

    const actual = await service.replyHandshake(anonUser.id, anonContact.name);

    expect(usersService.findById).toBeCalledTimes(1);
    expect(usersService.findById).lastCalledWith(anonUser.id);
    expect(actual).toMatchObject(expected);
  });

  it(`acceptReplyHandshake stores a given handshake against the contact of a given name for a given userId`, async () => {
    const noHandShakeContact: Contact = { ...anonContact };
    const expected: Contact = { ...noHandShakeContact, ...{ expectedHandShake } };

    jest.spyOn(repository, 'findOneOrFail').mockResolvedValueOnce(expected);
    jest.spyOn(repository, 'save').mockResolvedValueOnce(expected);

    await service.acceptReplyHandshake(anonUser.id, anonContact.name, expectedHandShake);

    expect(repository.findOneOrFail).toBeCalledTimes(1);
    expect(repository.save).toBeCalledTimes(1);
    expect(repository.save).lastCalledWith(expected);
  });
});
