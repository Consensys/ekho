import { Test, TestingModule } from '@nestjs/testing';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { fakeContact, fakeContactHandshake } from './test-helpers/faker';
import { mockContactsService } from './test-helpers/mock-contacts-service';

describe('Contacts Controller', () => {
  let controller: ContactsController;
  let service: ContactsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [{ provide: ContactsService, useValue: mockContactsService() }],
    }).compile();

    controller = module.get<ContactsController>(ContactsController);
    service = module.get<ContactsService>(ContactsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it(`GET /contacts/:userId
    - delegates ContactsService.getByUser to get all contacts for a given userId`, async () => {
    const anonContact = fakeContact();
    const expected = [anonContact];

    jest.spyOn(service, 'getByUser').mockResolvedValueOnce(expected);

    const actual = await controller.getContactsForUser(-1);

    expect(service.getByUser).toBeCalledTimes(1);
    expect(actual).toBe(expected);
  });

  it(`POST contacts/generate-init-handshake/:userId/:contactName
    - delegates ContactsService.initHandshake to create a handshake for
    a contact with a given name, of a given userId`, async () => {
    const expected = fakeContactHandshake();

    jest.spyOn(service, 'initHandshake').mockResolvedValueOnce(expected);

    const actual = await controller.initHandshake(-1, 'anon-contact-name');

    expect(service.initHandshake).toBeCalledTimes(1);
    expect(actual).toBe(expected);
  });

  it(`POST contacts/accept-init-handshake/:userId/:contactName
    - delegates ContactsService.acceptInitHandshake to store a given handshake for
    a contact with a given name, of a given userId`, async () => {
    const anonUserId = -1;
    const anonContactName = 'no-such-name';
    const expected = fakeContactHandshake();

    jest.spyOn(service, 'acceptInitHandshake');

    await controller.acceptInitHandshake(anonUserId, anonContactName, expected);

    expect(service.acceptInitHandshake).toBeCalledTimes(1);
    expect(service.acceptInitHandshake).lastCalledWith(anonUserId, anonContactName, expected);
  });

  it(`POST contacts/generate-reply-handshake/:userId/:contactName
    - delegates ContactsService.replyHandshake to return a reply handshake for
    a contact with a given name, of a given userId`, async () => {
    const expected = fakeContactHandshake();

    jest.spyOn(service, 'replyHandshake').mockResolvedValueOnce(expected);

    const actual = await controller.generateReplyHandshake(-1, 'anon-contact-name');

    expect(service.replyHandshake).toBeCalledTimes(1);
    expect(actual).toBe(expected);
  });

  it(`POST contacts/accept-reply-handshake/:userId/:contactName
    - delegates ContactsService.acceptReplyHandshake to store a given reply handshake for
    a contact with a given name, of a given userId`, async () => {
    const anonUserId = -1;
    const anonContactName = 'no-such-name';
    const expected = fakeContactHandshake();

    jest.spyOn(service, 'acceptReplyHandshake');

    await controller.acceptReplyHandshake(anonUserId, anonContactName, expected);

    expect(service.acceptReplyHandshake).toBeCalledTimes(1);
    expect(service.acceptReplyHandshake).lastCalledWith(anonUserId, anonContactName, expected);
  });
});
