import { ContactsService } from '../contacts.service';

export const mockContactsService: jest.Mock<Omit<
  ContactsService,
  'contactsRepository cryptographyService usersService'
>> = jest.fn(() => {
  return {
    createContact: jest.fn(),
    getByUser: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    findOneOrCreate: jest.fn(),
    delete: jest.fn(),
    initHandshake: jest.fn(),
    acceptInitHandshake: jest.fn(),
    replyHandshake: jest.fn(),
    acceptReplyHandshake: jest.fn(),
    findOneContact: jest.fn(),
    findOneContactBySigningKey: jest.fn(),
    findOrCreateExternalContact: jest.fn(),
  };
});
