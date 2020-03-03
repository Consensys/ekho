import { INestApplication, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import moment from 'moment';
import * as supertest from 'supertest';
import { ChannelsModule } from '../src/channels/channels.module';
import { ChannelMessage } from '../src/channels/entities/channelmessages.entity';
import { ContactsModule } from '../src/contacts/contacts.module';
import ContactHandshakeDto from '../src/contacts/dto/contact-handshake.dto';
import { DevelopmentModule } from '../src/development/development.module';
import ipfsConfiguration from '../src/ipfs/ipfs.configuration';
import { IpfsModule } from '../src/ipfs/ipfs.module';
import keyManagerConfiguration from '../src/key-manager/key-manager.configuration';
import UserDto from '../src/users/dto/user.dto';
import web3Configuration from '../src/web3/web3.configuration';
import { Web3Module } from '../src/web3/web3.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let testId: string;
  let bob: UserDto;
  let alice: UserDto;
  let aliceContactFromBob;
  let bobContactFromAlice;

  beforeAll(() => {
    testId = moment(new Date()).format('YYYYMMDD-HHmmss');
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        DevelopmentModule,
        ContactsModule,
        ChannelsModule,
        Web3Module,
        IpfsModule,
        TypeOrmModule.forRoot({ keepConnectionAlive: true }),
        ConfigModule.forRoot({
          isGlobal: true,
          load: [ipfsConfiguration, web3Configuration, keyManagerConfiguration],
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('contacts creation and handshake', async () => {
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
    aliceContactFromBob = await getContact(bob.id, aliceContactName);
    bobContactFromAlice = await getContact(alice.id, bobContactName);

    expect(aliceContactFromBob.handshakePublicKey).toStrictEqual(bobContactFromAlice.oneuseKey);
    expect(bobContactFromAlice.handshakePublicKey).toStrictEqual(aliceContactFromBob.oneuseKey);

    // 3) verify signatures
    await expect(
      verifySignature(aliceContactFromBob.signature, aliceContactFromBob.oneuseKey, aliceContactFromBob.signingKey),
    ).resolves.toStrictEqual({ result: true });
    await expect(
      verifySignature(bobContactFromAlice.signature, bobContactFromAlice.oneuseKey, bobContactFromAlice.signingKey),
    ).resolves.toStrictEqual({ result: true });

    // ================================================================================================================

    // ===== in scope helper function =====
    const createChannel = async (name: string, userId: number, contactId: number) => {
      Logger.debug(JSON.stringify({ name: `${name}-${testId}`, userId, contactId }));
      const response = await supertest
        .agent(app.getHttpServer())
        .post('/channels')
        .send({ name: `${name}-${testId}`, userId, contactId })
        .expect(201);
      return response.body;
    };

    const createChannelMessage = async (message: string, userId: number, channelId: number) => {
      const response = await supertest
        .agent(app.getHttpServer())
        .post('/channels/message')
        .send({ messageContents: `${message}`, userId: `${userId}`, channelId: `${channelId}` })
        .expect(201);
      return response.body;
    };

    const processEvents = async () => {
      const response = await supertest
        .agent(app.getHttpServer())
        .get('/channels/refresh')
        .expect(200);
      return response.body;
    };

    const getUserMessages = async (userId: number) => {
      const response = await supertest
        .agent(app.getHttpServer())
        .get(`/channels/message?contactId=${userId}`)
        .expect(200);
      return response.body;
    };

    // ===== channel interations =====

    // 1) create a channel between bob and alice and vice-versa
    const channelBobToAlice = await createChannel('bob-to-alice', bob.id, aliceContactFromBob.id);
    const channelAliceToBob = await createChannel('alice-to-bob', alice.id, bobContactFromAlice.id);

    // 2) send 2 messages from bob to alice and vice-versa
    await createChannelMessage(`[${testId}] message #1 from bob to alice`, bob.id, channelBobToAlice.id);
    await createChannelMessage(`[${testId}] message #2 from bob to alice`, bob.id, channelBobToAlice.id);
    await createChannelMessage(`[${testId}] message #1 from alice to bob`, alice.id, channelAliceToBob.id);
    await createChannelMessage(`[${testId}] message #2 from alice to bob`, alice.id, channelAliceToBob.id);

    // 3) process events
    await processEvents();

    // 4) retrieve received messages for bob and alice
    const bobMessages: ChannelMessage[] = await getUserMessages(aliceContactFromBob.id);
    const aliceMessages: ChannelMessage[] = await getUserMessages(bobContactFromAlice.id);

    // ===== verification and assertions =====

    expect(bobMessages.length).toBe(2);
    expect(bobMessages[0].nonce).toStrictEqual(1);
    expect(bobMessages[0].messageContents).toStrictEqual(`[${testId}] message #1 from alice to bob`);
    expect(bobMessages[1].nonce).toStrictEqual(2);
    expect(bobMessages[1].messageContents).toStrictEqual(`[${testId}] message #2 from alice to bob`);

    expect(aliceMessages.length).toBe(2);
    expect(aliceMessages[0].nonce).toStrictEqual(1);
    expect(aliceMessages[0].messageContents).toStrictEqual(`[${testId}] message #1 from bob to alice`);
    expect(aliceMessages[1].nonce).toStrictEqual(2);
    expect(aliceMessages[1].messageContents).toStrictEqual(`[${testId}] message #2 from bob to alice`);
  });

  afterAll(async () => {
    await app.close();
  });
});
