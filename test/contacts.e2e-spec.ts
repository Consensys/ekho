import { INestApplication, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import moment from 'moment';
import * as supertest from 'supertest';
import { ContactsModule } from '../src/contacts/contacts.module';
import ContactHandshakeDto from '../src/contacts/dto/contact-handshake.dto';
import { DevelopmentModule } from '../src/development/development.module';
import keyManagerConfiguration from '../src/key-manager/key-manager.configuration';
import UserDto from '../src/users/dto/user.dto';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let testId: string;
  let bob: UserDto;
  let alice: UserDto;

  beforeAll(() => {
    testId = moment(new Date()).format('YYYYMMDD-HHmmss');
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        DevelopmentModule,
        ContactsModule,
        TypeOrmModule.forRoot(),
        ConfigModule.forRoot({
          isGlobal: true,
          load: [keyManagerConfiguration],
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('contacts creation and hanshake', async () => {
    // ===== in scope helper function =====
    const createUser = async name => {
      const response = await supertest
        .agent(app.getHttpServer())
        .post('/users')
        .send({ name: `${name}-${testId}` })
        .expect(201);
      return response.body;
    };

    const initHandshake = async (userId, contactName) => {
      const response = await supertest
        .agent(app.getHttpServer())
        .post(`/contacts/generate-init-handshake/${userId}/${contactName}`)
        .expect(201);
      return response.body;
    };

    const acceptInitHandshake = async (userId, contactName, handshake) => {
      const response = await supertest
        .agent(app.getHttpServer())
        .post(`/contacts/accept-init-handshake/${userId}/${contactName}`)
        .send(handshake)
        .expect(201);
      return response.body;
    };

    const replyHandshake = async (userId, contactName) => {
      const response = await supertest
        .agent(app.getHttpServer())
        .post(`/contacts/generate-reply-handshake/${userId}/${contactName}`)
        .expect(201);
      return response.body;
    };

    const acceptReplyHandshake = async (userId, contactName, handshake) => {
      const response = await supertest
        .agent(app.getHttpServer())
        .post(`/contacts/accept-reply-handshake/${userId}/${contactName}`)
        .send(handshake)
        .expect(201);
      return response.body;
    };

    const getMasterKey = async (userId, contactName) => {
      const response = await supertest
        .agent(app.getHttpServer())
        .get(`/development/generate-master-key/${userId}/${contactName}`)
        .expect(200);
      return response.body;
    };

    const getContact = async (userId, contactName) => {
      const response = await supertest
        .agent(app.getHttpServer())
        .get(`/development/contact/${userId}/${contactName}`)
        .expect(200);
      return response.body;
    };

    const verifySignature = async (signature, oneuseKey, signingKey) => {
      const response = await supertest
        .agent(app.getHttpServer())
        .get(
          `/development/cryptography/verify-signature` +
            `/${encodeURIComponent(signature)}` +
            `/${encodeURIComponent(oneuseKey)}` +
            `/${encodeURIComponent(signingKey)}`,
        )
        .expect(200);
      return response.body;
    };

    // ===== contact interations =====

    // 1) setup users bob and alice
    bob = await createUser('bob');
    const aliceContactName = `alice-contact-${testId}`;
    alice = await createUser('alice');
    const bobContactName = `bob-contact-${testId}`;

    // 2) bob generate handshake for alice
    const bobToAliceHandshake: ContactHandshakeDto = await initHandshake(bob.id, aliceContactName);
    Logger.debug(bobToAliceHandshake, 'bob');
    // 3) alice accepts hanshake and adds it to her contacts
    await acceptInitHandshake(alice.id, bobContactName, bobToAliceHandshake);

    // 4) alice generates handshake for bob
    const aliceToBobHandshake = await replyHandshake(alice.id, bobContactName);

    // 5) bob accepts handshake and adds it to his contacts
    await acceptReplyHandshake(bob.id, aliceContactName, aliceToBobHandshake);

    // ===== verification and assertions =====

    // 1) both alice and bob must generate the same master key
    const bobMasterKey = await getMasterKey(bob.id, aliceContactName);
    const aliceMasterKey = await getMasterKey(alice.id, bobContactName);
    expect(bobMasterKey).toStrictEqual(aliceMasterKey);

    // 2) Bobs handshake public key has to correspond to Alices one-use Key (and vice-versa)
    const aliceContactFromBob = await getContact(bob.id, aliceContactName);
    const bobContactFromAlice = await getContact(alice.id, bobContactName);

    expect(aliceContactFromBob.handshakePublicKey).toStrictEqual(bobContactFromAlice.oneuseKey);
    expect(bobContactFromAlice.handshakePublicKey).toStrictEqual(aliceContactFromBob.oneuseKey);

    // 3) verify signatures
    await expect(
      verifySignature(aliceContactFromBob.signature, aliceContactFromBob.oneuseKey, aliceContactFromBob.signingKey),
    ).resolves.toStrictEqual({ result: true });
    await expect(
      verifySignature(bobContactFromAlice.signature, bobContactFromAlice.oneuseKey, bobContactFromAlice.signingKey),
    ).resolves.toStrictEqual({ result: true });
  });

  afterAll(async () => {
    await app.close();
  });
});
