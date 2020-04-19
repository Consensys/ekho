import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import moment from 'moment';
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
import { ChannelsApi } from './api/ChannelsApi';
import { ContactsApi } from './api/ContactsApi';
import { UsersApi } from './api/UsersApi';

describe('Happy Path (e2e)', () => {
  let app: INestApplication;
  let testId: string;
  let bob: UserDto;
  let alice: UserDto;
  let aliceContactFromBob;
  let bobContactFromAlice;
  let usersApi: UsersApi;
  let contactsApi: ContactsApi;
  let channelsApi: ChannelsApi;

  beforeAll(async () => {
    testId = moment(new Date()).format('YYYYMMDD-HHmmss');
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
    usersApi = new UsersApi(app, testId);
    contactsApi = new ContactsApi(app, testId);
    channelsApi = new ChannelsApi(app, testId);
  });

  describe('users', () => {
    it('create bob', async () => {
      bob = await usersApi.createUser('bob');
    });
    it('create alice', async () => {
      alice = await usersApi.createUser('alice');
    });
  });

  describe('contacts', () => {
    const aliceContactName = `alice-contact`;
    const bobContactName = `bob-contact`;
    let bobToAliceHandshake: ContactHandshakeDto;
    let aliceToBobHandshake: ContactHandshakeDto;
    it('1) bob generates handshake to alice', async () => {
      bobToAliceHandshake = await contactsApi.initHandshake(bob.id, aliceContactName);
    });

    it('2) alice accepts hanshake and adds it to her contacts', async () => {
      await contactsApi.acceptInitHandshake(alice.id, bobContactName, bobToAliceHandshake);
    });

    it('3) alice generates handshake for bob', async () => {
      aliceToBobHandshake = await contactsApi.replyHandshake(alice.id, bobContactName);
    });

    it('4) bob accepts handshake and adds it to his contacts', async () => {
      await contactsApi.acceptReplyHandshake(bob.id, aliceContactName, aliceToBobHandshake);
    });

    it('assertions & validations', async () => {
      // 1) both alice and bob must generate the same master key
      const bobMasterKey = await contactsApi.getMasterKey(bob.id, aliceContactName);
      const aliceMasterKey = await contactsApi.getMasterKey(alice.id, bobContactName);
      expect(bobMasterKey).toStrictEqual(aliceMasterKey);

      // 2) Bobs handshake public key has to correspond to Alices one-use Key (and vice-versa)
      aliceContactFromBob = await contactsApi.getContact(bob.id, aliceContactName);
      bobContactFromAlice = await contactsApi.getContact(alice.id, bobContactName);

      expect(aliceContactFromBob.handshakePublicKey).toStrictEqual(bobContactFromAlice.oneuseKey);
      expect(bobContactFromAlice.handshakePublicKey).toStrictEqual(aliceContactFromBob.oneuseKey);

      // 3) verify signatures
      await expect(
        contactsApi.verifySignature(
          aliceContactFromBob.signature,
          aliceContactFromBob.oneuseKey,
          aliceContactFromBob.signingKey,
        ),
      ).resolves.toStrictEqual({ result: true });
      await expect(
        contactsApi.verifySignature(
          bobContactFromAlice.signature,
          bobContactFromAlice.oneuseKey,
          bobContactFromAlice.signingKey,
        ),
      ).resolves.toStrictEqual({ result: true });
    });
  });

  describe('channels - 1-to-1', () => {
    let channelBobToAlice;
    let channelAliceToBob;
    it('1) bob creates channel to alice', async () => {
      channelBobToAlice = await channelsApi.createChannel('bob-to-alice', bob.id, aliceContactFromBob.id);
    });

    it('1) alice creates channel to bob', async () => {
      channelAliceToBob = await channelsApi.createChannel('alice-to-bob', alice.id, bobContactFromAlice.id);
    });

    it('2) bob sends 2 messages to alice', async () => {
      await channelsApi.createChannelMessage(`[${testId}] message #1 from bob to alice`, bob.id, channelBobToAlice.id);
      await channelsApi.createChannelMessage(`[${testId}] message #2 from bob to alice`, bob.id, channelBobToAlice.id);
    });

    it('2) alice sends 2 messages to bob', async () => {
      await channelsApi.createChannelMessage(
        `[${testId}] message #1 from alice to bob`,
        alice.id,
        channelAliceToBob.id,
      );
      await channelsApi.createChannelMessage(
        `[${testId}] message #2 from alice to bob`,
        alice.id,
        channelAliceToBob.id,
      );
    });

    it('3) process events', async () => {
      await channelsApi.processEvents(bob.id);
      await channelsApi.processEvents(alice.id);
    });

    it('4) bob reads 2 messages from alice', async () => {
      const bobMessages: ChannelMessage[] = await channelsApi.getUserMessages(aliceContactFromBob.id);

      expect(bobMessages.length).toBe(2);
      expect(bobMessages[0].nonce).toStrictEqual(1);
      expect(bobMessages[0].messageContents).toStrictEqual(`[${testId}] message #1 from alice to bob`);
      expect(bobMessages[1].nonce).toStrictEqual(2);
      expect(bobMessages[1].messageContents).toStrictEqual(`[${testId}] message #2 from alice to bob`);
    });

    it('4) alice reads 2 messages from bob', async () => {
      const aliceMessages: ChannelMessage[] = await channelsApi.getUserMessages(bobContactFromAlice.id);

      expect(aliceMessages.length).toBe(2);
      expect(aliceMessages[0].nonce).toStrictEqual(1);
      expect(aliceMessages[0].messageContents).toStrictEqual(`[${testId}] message #1 from bob to alice`);
      expect(aliceMessages[1].nonce).toStrictEqual(2);
      expect(aliceMessages[1].messageContents).toStrictEqual(`[${testId}] message #2 from bob to alice`);
    });
  });

  describe('channels - broadcast', () => {
    let bobBroadcastChannel;
    let aliceBroadcastChannel;
    it('1) bob creates broadcast channel', async () => {
      bobBroadcastChannel = await channelsApi.createBroadcastChannel('bob-broadcast', bob.id);
    });

    it('1) alice create broadcast channel', async () => {
      aliceBroadcastChannel = await channelsApi.createBroadcastChannel('alice-broadcast', alice.id);
    });

    it('2) bob creates a broadcast listener to alices messages', async () => {
      await channelsApi.followBroadcast(bob.id, aliceBroadcastChannel.broadcastLink);
    });

    it('2) alice creates a broadcast listener to bobs messages', async () => {
      await channelsApi.followBroadcast(alice.id, bobBroadcastChannel.broadcastLink);
    });

    it('3) bob broadcasts a message', async () => {
      await channelsApi.createChannelMessage(
        `[${testId}] broadcast message #1 from Bob`,
        bob.id,
        bobBroadcastChannel.channelId,
      );
    });

    it('3) alice broadcasts a message', async () => {
      await channelsApi.createChannelMessage(
        `[${testId}] broadcast message #1 from Alice`,
        alice.id,
        aliceBroadcastChannel.channelId,
      );
    });

    it('4) process events', async () => {
      await channelsApi.processEvents(bob.id);
      await channelsApi.processEvents(alice.id);
    });

    it('5) bob listens alices broadcast channel and reads its message', async () => {
      const bobBroadcastMessages: ChannelMessage[] = await channelsApi.getUserMessages(aliceContactFromBob.id);

      expect(bobBroadcastMessages.length).toBe(3);
      expect(bobBroadcastMessages[2].nonce).toStrictEqual(1);
      expect(bobBroadcastMessages[2].messageContents).toStrictEqual(`[${testId}] broadcast message #1 from Alice`);
    });

    it('5) alice listens bobs broadcast channel and reads its message', async () => {
      const aliceBroadcastMessages: ChannelMessage[] = await channelsApi.getUserMessages(bobContactFromAlice.id);

      expect(aliceBroadcastMessages.length).toBe(3);
      expect(aliceBroadcastMessages[2].nonce).toStrictEqual(1);
      expect(aliceBroadcastMessages[2].messageContents).toStrictEqual(`[${testId}] broadcast message #1 from Bob`);
    });
  });
  afterAll(async () => {
    await app.close();
  });
});
