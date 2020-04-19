import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EkhoEvent } from 'src/events/entities/events.entity';
import { getManager, getRepository, IsNull, Repository } from 'typeorm';
import { Contact } from '../contacts/contacts.entity';
import { ContactsService } from '../contacts/contacts.service';
import { CryptographyService } from '../cryptography/cryptography.service';
import EkhoEventDto from '../events/dto/ekhoevent.dto';
import { EventsService } from '../events/events.service';
import { IpfsMessageDto } from '../ipfs/dto/ipfs-message.dto';
import { IpfsService } from '../ipfs/ipfs.service';
import { KeyManager } from '../key-manager/key-manager.interface';
import { User } from '../users/entities/users.entity';
import { UsersService } from '../users/users.service';
import { Web3Service } from '../web3/web3.service';
import BroadcastChannelDto from './dto/broadcastchannel.dto';
import CreateBroadcastChannelDto from './dto/create-broadcastchannel.dto';
import CreateChannelDto from './dto/create-channel.dto';
import CreateExternalChannelDto from './dto/create-externalchannel.dto';
import EncodedMessageDto from './dto/encodedmessage.dto';
import BroadcastChannelLinkDto from './dto/link-broadcastchannel.dto';
import ProcessReport from './dto/processreport.dto';
import RawMessageDto from './dto/rawmessage.dto';
import { BroadcastChannel } from './entities/broadcastchannels.entity';
import { ChannelMember } from './entities/channelmembers.entity';
import { ChannelMessage } from './entities/channelmessages.entity';
import { Channel } from './entities/channels.entity';

@Injectable()
export class ChannelsService {
  private readonly BASE_64 = 'base64';
  private readonly UTF_8 = 'utf-8';
  private readonly HEX = 'hex';
  private readonly CHAIN_KEY_ID = 1;
  private readonly CHAIN_KEY_CONTEXT = 'ChainKey';
  private readonly MESSAGE_KEY_RATCHET = 1;
  private readonly CHAIN_KEY_RATCHET = 2;
  private readonly INITIAL_NONCE = 1;

  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private readonly channelMemberRepository: Repository<ChannelMember>,
    @InjectRepository(ChannelMessage)
    private readonly channelMessageRepository: Repository<ChannelMessage>,
    @InjectRepository(BroadcastChannel)
    private readonly broadcastChannelRepository: Repository<BroadcastChannel>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject('KeyManager')
    private readonly keyManager: KeyManager,
    private readonly userService: UsersService,
    private readonly contactService: ContactsService,
    private readonly cryptoService: CryptographyService,
    private readonly ipfsService: IpfsService,
    private readonly web3Service: Web3Service,
    private readonly eventService: EventsService,
  ) {}

  // *** Functional Methods ***

  // Process all pending blockchain events in DB

  // change this to iterating through all channel members
  // looking for next channel identifier
  // if it finds it, process it
  // keep going until all channel members are done and
  // no new events are found
  // for loop through channel members
  // if one channel identifier found, process and iterate again on that channel member
  // until all events are processed
  // go onto next channel member

  async process(userId: number): Promise<ProcessReport> {
    const processReport = new ProcessReport();
    processReport.receivedMessages = 0;
    processReport.processedTotal = 0;
    processReport.receivedMessageEvents = [];

    const channelMembersByUser = await this.findChannelMembersByUser(userId);

    for (const channelMember of channelMembersByUser) {
      let nextChannelIdentifier = channelMember.nextChannelIdentifier;
      Logger.debug('channel member,', nextChannelIdentifier);

      let allMessagesRead: boolean = false;

      while (!allMessagesRead) {
        // check if we have an event for that channel member
        const newEvent: EkhoEvent = await this.eventService.getTransactionByChannelId(nextChannelIdentifier);

        // if we have an event, process it
        if (newEvent) {
          Logger.debug('event found: ', newEvent.txHash);

          const incomingMessage = new EncodedMessageDto();
          incomingMessage.channelIdentifier = newEvent.channelId;
          incomingMessage.encryptedMessageLink = newEvent.content;
          incomingMessage.encryptedMessageLinkSignature = newEvent.signature;

          try {
            const message: RawMessageDto = await this.validateAndDecryptEvent(newEvent, incomingMessage);
            if (message) {
              processReport.receivedMessages++;
              processReport.receivedMessageEvents.push(incomingMessage);
              nextChannelIdentifier = await (await this.findChannelMemberById(channelMember.id)).nextChannelIdentifier;
            }
          } catch (e) {
            Logger.debug('Event could not be decoded', newEvent.txHash.toString());
          } finally {
            processReport.processedTotal++;
          }
        } else {
          allMessagesRead = true;
        }
      }
    }
    return processReport;
  }

  async processAllPendingEvents(): Promise<ProcessReport> {
    const processReport = new ProcessReport();
    processReport.receivedMessages = 0;
    processReport.processedTotal = 0;
    processReport.receivedMessageEvents = [];

    let completed: boolean = false;
    Logger.debug('Processing pending events');
    try {
      while (!completed) {
        // iterate through contact

        const unprocessedEvent: EkhoEventDto = await this.eventService.getFirstUnprocessedEvent();
        if (unprocessedEvent) {
          const incomingMessage = new EncodedMessageDto();
          incomingMessage.channelIdentifier = unprocessedEvent.channelIdentifier;
          incomingMessage.encryptedMessageLink = unprocessedEvent.encryptedMessageLink;
          incomingMessage.encryptedMessageLinkSignature = unprocessedEvent.encryptedMessageLinkSignature;
          // get the original event
          const msgEvent: EkhoEvent = await this.eventService.getOneById(unprocessedEvent.eventIdentifier);

          try {
            const message: RawMessageDto = await this.validateAndDecryptEvent(msgEvent, incomingMessage);
            if (message) {
              processReport.receivedMessages++;
              processReport.receivedMessageEvents.push(incomingMessage);
            }
          } catch (e) {
            Logger.debug('Event could not be decoded', unprocessedEvent.eventIdentifier.toString());
          } finally {
            await this.eventService.markEventAsProcessed(unprocessedEvent.eventIdentifier);
            processReport.processedTotal++;
          }
        } else {
          completed = true;
          Logger.debug('no unprocessed events');
        }
      }
    } catch (e) {
      Logger.debug('Error getting unprocessed events ', e.message);
      throw e;
    }
    Logger.debug('Received messages: ', processReport.receivedMessages.toString());
    return processReport;
  }

  // Create a channel message
  async createChannelMessage(channelMessage: RawMessageDto): Promise<EncodedMessageDto> {
    Logger.debug('Sending channel message for user ', channelMessage.userId.toString());

    // get the user - fail if they don't exist
    const messageSender = await this.userService.findById(channelMessage.userId, true);

    // get the channel member
    const channelMember = await this.findChannelMemberByUserAndChannel(channelMessage.userId, channelMessage.channelId);

    // get next expected message nonce
    const nonce = await this.getExpectedMessageNonceByChannelMemberId(channelMember.id);

    // the message is coming from the user, so it's an outgoing message
    const newChannelMessage = await this.createMessage(channelMember, channelMessage.messageContents, nonce);

    // Get the Channel Identifier for the message
    const senderPublicKey = await this.keyManager.readPublicSigningKey(messageSender.id);

    const channelIdentifier = await this.createChannelIdentifier(
      senderPublicKey,
      channelMember.channel.channelKey,
      nonce,
    );

    // Get the message key
    const messageKey = await this.getMessageKey(channelMember.messageChainKey);

    // update the message with the message key  //TODO refactor this so it's less fragmented
    newChannelMessage.messageKey = messageKey;

    // encrypt the message
    const newEncryptedMessage = this.cryptoService.encrypt(
      newChannelMessage.messageContents,
      nonce,
      messageKey,
      this.UTF_8,
      this.BASE_64,
    );

    // send the message to IPFS
    const messageLink = await this.sendToIpfs(newEncryptedMessage);

    // encrypt the message link with the message key
    const encryptedMessageLink = this.cryptoService.encrypt(messageLink, nonce, messageKey, this.UTF_8, this.BASE_64);

    // hash the encrypted message link with message nonce (to prevent replay attacks)
    const EMLwithNonce = this.cryptoService.hash(encryptedMessageLink + nonce.toString());

    // sign the encrypted IPFS hash + message nonce with the user signing key
    const Signature = await this.keyManager.sign(messageSender.id, EMLwithNonce);

    // encrypt the signature with the message key
    const encryptedSignature = this.cryptoService.encrypt(Signature, nonce, messageKey, this.BASE_64, this.BASE_64);

    // send the blockchain transaction
    const mined = await this.sendToChain(channelIdentifier, encryptedMessageLink, encryptedSignature);

    // sacrifice a chicken in the hope that this has been successful
    if (mined) {
      // Update the member message chain key
      channelMember.messageChainKey = await this.ratchetChainKey(channelMember.messageChainKey);

      // Update the member next channel identifier
      channelMember.nextChannelIdentifier = await this.createChannelIdentifier(
        senderPublicKey,
        channelMember.channel.channelKey,
        nonce + 1,
      );

      // save the channel member & message details
      await getManager().transaction(async transactionalEntityManager => {
        await transactionalEntityManager.save(newChannelMessage);
        await transactionalEntityManager.save(channelMember);
      });

      Logger.debug('Channel message sent');
      // return the encoded message
      const encodedMessage = new EncodedMessageDto();
      encodedMessage.channelIdentifier = channelIdentifier;
      encodedMessage.encryptedMessageLink = encryptedMessageLink;
      encodedMessage.encryptedMessageLinkSignature = encryptedSignature;
      return encodedMessage;
    }
  }

  async getBroadcastChannelLink(userId: number, channelId: number): Promise<BroadcastChannelLinkDto> {
    await this.userService.findById(userId);

    const broadcastChannel = await this.broadcastChannelRepository.findOneOrFail({
      relations: ['channel'],
      where: { user: { id: userId }, channel: { id: channelId } },
    });

    const channelLink = new BroadcastChannelLinkDto();
    channelLink.name = broadcastChannel.channel.name;
    channelLink.broadcastKey = broadcastChannel.broadcastKey;

    channelLink.signingKey = await this.keyManager.readPublicSigningKey(userId);
    const dataToSign = this.cryptoService.hash(channelLink.name + channelLink.broadcastKey + channelLink.signingKey);
    channelLink.signature = await this.keyManager.sign(userId, dataToSign);

    const verified = this.keyManager.verifySignature(channelLink.signature, dataToSign, channelLink.signingKey);

    if (!verified) {
      throw new Error('signature not validating correctly');
    }

    return channelLink;
  }

  // adds a broadcast channel from a non-contact source
  async followBroadcast(userId: number, channelLink: BroadcastChannelLinkDto): Promise<Channel> {
    Logger.debug('creating broadcast channel listener');
    // 1. get user (fail if not found)
    await this.userService.findById(userId);

    // validate signature
    const signedData = this.cryptoService.hash(channelLink.name + channelLink.broadcastKey + channelLink.signingKey);
    const signed = this.keyManager.verifySignature(channelLink.signature, signedData, channelLink.signingKey);

    if (signed) {
      // check if contact exists for this signingkey (in which case use them, otherwise create one)
      const contact = await this.contactService.findOneContactBySigningKey(
        userId,
        channelLink.name,
        channelLink.signingKey,
      );

      // create channel
      const newChannel = await this.createChannel(channelLink.name, channelLink.broadcastKey);

      const userChannelMember = await this.createChannelMember(null, contact, newChannel, channelLink.broadcastKey);

      // save everything (in a transaction)

      await getManager().transaction(async transactionalEntityManager => {
        await transactionalEntityManager.save(newChannel);
        await transactionalEntityManager.save(userChannelMember);
      });

      Logger.debug('broadcast channel listener created ', newChannel.id.toString());
      // 8. return the saved channel
      return await this.findChannelById(newChannel.id);
    }
  }

  // Create a channel and members
  async createBroadcastChannel(channel: CreateBroadcastChannelDto): Promise<BroadcastChannelDto> {
    Logger.debug('creating broadcast channel');

    // get user
    const channelUser = await this.userService.findById(channel.userId);

    // create shared secret
    const sharedSecret = await this.cryptoService.generateRandomBytes().toString(this.BASE_64);

    // create channel
    const newChannel = await this.createChannel(channel.name, sharedSecret);

    // create channelmember for user
    const userChannelMember = await this.createChannelMember(channelUser, null, newChannel, sharedSecret);

    // create Broadcast Channel for user
    const broadcastChannel = await this.linkBroadcastChannel(channel.name, sharedSecret, channelUser, newChannel);

    // 7. save everything (in a transaction)
    await getManager().transaction(async transactionalEntityManager => {
      await transactionalEntityManager.save(newChannel);
      await transactionalEntityManager.save(userChannelMember);
      await transactionalEntityManager.save(broadcastChannel);
    });

    // get the broadcast channel + sharing link details
    const newBroadcastChannel = new BroadcastChannelDto();
    newBroadcastChannel.channelId = newChannel.id;
    newBroadcastChannel.userId = channel.userId;
    newBroadcastChannel.broadcastLink = await this.getBroadcastChannelLink(channelUser.id, newChannel.id);

    Logger.debug('broadcast channel created ', newChannel.id.toString());

    return newBroadcastChannel;
  }

  // Get a specified user's broadcast channels
  async getBroadcastChannels(userId: number): Promise<BroadcastChannel[]> {
    return this.broadcastChannelRepository.find({
      relations: ['channel', 'user'],
      where: { user: userId },
    });
  }

  // Create a contact and channel based on an external contact
  // (where the handshake is performed outside of ekho)
  async createExternalChannelAndMembers(channel: CreateExternalChannelDto): Promise<Channel> {
    Logger.debug('creating external contact, channel and members');

    // 1. get user
    const channelUser = await this.userService.findById(channel.userId);

    // 2. find / create contact
    const channelContact = await this.contactService.findOrCreateExternalContact(
      channel.userId,
      channel.contactName,
      channel.contactPublicKey,
      channel.contactIntegrationId,
    );

    const sharedSecret = channel.channelSharedSecret;

    // 4. create channel
    const newChannel = await this.createChannel(channel.name, sharedSecret);

    // 5. create channelmember for user
    const userChannelMember = await this.createChannelMember(channelUser, null, newChannel, sharedSecret);

    // 6. create channelmember for contact
    const contactChannelMember = await this.createChannelMember(null, channelContact, newChannel, sharedSecret);

    // 7. save everything (in a transaction)
    await getManager().transaction(async transactionalEntityManager => {
      await transactionalEntityManager.save(newChannel);
      await transactionalEntityManager.save(userChannelMember);
      await transactionalEntityManager.save(contactChannelMember);
    });

    Logger.debug('channel and members created ', newChannel.id.toString());

    // 8. return the saved channel
    return await this.findChannelById(newChannel.id);
  }

  // Create a channel and members
  async createChannelAndMembers(channel: CreateChannelDto): Promise<Channel> {
    Logger.debug('creating channel and members');

    // 1. get user
    const channelUser = await this.userService.findById(channel.userId);

    // 2. get contact (must be owned by user)
    const channelContact = await this.contactService.findOneContact(channel.userId, channel.contactId);

    // 3. create shared secret
    const sharedSecret = await this.createSharedSecret(channelContact);

    // 4. create channel
    const newChannel = await this.createChannel(channel.name, sharedSecret);

    // 5. create channelmember for user
    const userChannelMember = await this.createChannelMember(channelUser, null, newChannel, sharedSecret);

    // 6. create channelmember for contact
    const contactChannelMember = await this.createChannelMember(null, channelContact, newChannel, sharedSecret);

    // 7. save everything (in a transaction)
    await getManager().transaction(async transactionalEntityManager => {
      await transactionalEntityManager.save(newChannel);
      await transactionalEntityManager.save(userChannelMember);
      await transactionalEntityManager.save(contactChannelMember);
    });

    Logger.debug('channel and members created ', newChannel.id.toString());

    // 8. return the saved channel
    return await this.findChannelById(newChannel.id);
  }

  // *** (CHANNEL MESSAGE) Find Methods **

  // Finds a channelmessage  by id (TODO: for user id)
  async findChannelMessageByUserId(id: number): Promise<ChannelMessage[]> {
    const allMessages = await this.channelMessageRepository.find({
      relations: ['channelMember', 'channelMember.user'],
      // problem: where clause not working as expected
      // where: { channelMember: { id: 33}} // this works
      // tried various options but did not seem to work
      // where: { channelMember: { userId: {id} }},
      // where: { channelMember: { userId: { id: 99 }} }, // doesnt work
      // where: { channelMember: {  user: { id: 99 } } },  // doesnt work
      // where: { channelMember: {  userId: 99 } }, // doesnt work
      // where: { channelMember: { user: { id }}} // doesn't work
      // where: {  channelMember: { messageChainKey: 'dfce83f8d1c44918d0fb53dd7b7234fdfe715aaaafc241b24e439c964b531af6'}} // did not work either
      order: { nonce: 'ASC' },
    });
    // as the where clause above isn't working, doing in process filtering for now
    // but for some odd reason, id passes as string... converting to int to use in filter
    // suspecting a bug in nestjs
    return allMessages.filter(m => m.channelMember.user?.id === parseInt(`${id}`, 10));
  }

  // Finds a channelmessage  by id (TODO: for user id)
  async findChannelMessageByContactId(id: number): Promise<ChannelMessage[]> {
    const allMessages = await this.channelMessageRepository.find({
      relations: ['channelMember', 'channelMember.contact'],
      // missing where clause - see above findChannelMessageByUserId
      order: { id: 'ASC' },
    });
    // see above findChannelMessageByUserId
    return allMessages.filter(m => m.channelMember.contact?.id === parseInt(`${id}`, 10));
  }

  // Finds all channel messages (TODO: for user id)
  async findAllChannelMessages(): Promise<ChannelMessage[]> {
    return this.channelMessageRepository.find({ relations: ['channelMember'] });
  }

  // *** (CHANNEL MEMBER) Find methods ***

  // Finds channel member by id (TODO: for user id)
  async findChannelMemberById(id: number): Promise<ChannelMember> {
    return this.channelMemberRepository.findOneOrFail({
      relations: ['channel', 'contact', 'user'],
      where: { id },
    });
  }

  // Finds all records based on search criteria (TODO: for user id)
  async findAllChannelMembers(): Promise<ChannelMember[]> {
    return this.channelMemberRepository.find({
      relations: ['channel', 'contact', 'user'],
    });
  }

  // Finds channel member by userid and channelid
  async findChannelMemberByUserAndChannel(userId: number, channelId: number): Promise<ChannelMember> {
    return this.channelMemberRepository.findOneOrFail({
      relations: ['channel', 'contact', 'user'],
      where: { channel: channelId, user: userId },
    });
  }

  // Finds channel member by userid and channelid
  async findChannelMembersByUser(userId: number): Promise<ChannelMember[]> {
    const channelMembers = await getRepository(ChannelMember)
      .createQueryBuilder('channelmember')
      .innerJoin('channelmember.contact', 'contact', 'contact.user = :userId', { userId })
      .getMany();

    return channelMembers;
  }

  // *** Channel FIND Methods ***

  // Finds a channel by its channel id (TODO: for user id)
  async findChannelById(id: number): Promise<Channel> {
    return this.channelRepository.findOneOrFail({
      relations: ['channelmembers'],
      where: { id },
    });
  }

  // Finds all channels (TODO: for user id)
  async findAllChannels(): Promise<Channel[]> {
    return this.channelRepository.find({ relations: ['channelmembers'] });
  }

  // *** Private methods ***

  // Validate and decrypt a blockchain event
  private async validateAndDecryptEvent(
    messageEvent: EkhoEvent,
    channelMessage: EncodedMessageDto,
  ): Promise<RawMessageDto> {
    Logger.debug('validating and decrypting event');

    // break up the message into its parts
    const channelIdentifier = channelMessage.channelIdentifier;
    const encryptedMessageLink = channelMessage.encryptedMessageLink;
    const signature = channelMessage.encryptedMessageLinkSignature;

    // find the channel member
    const potentialChannelMembers = await this.findChannelMemberbyNextChannelIdentifier(channelIdentifier);

    for (const channelMember of potentialChannelMembers) {
      Logger.debug('found potential message from channel member ', channelMember.id.toString());

      // get the message key
      const messageKey = await this.getMessageKey(channelMember.messageChainKey);

      // get next expected message nonce
      const nonce = await this.getExpectedMessageNonceByChannelMemberId(channelMember.id);

      // first decrypt the signature with the expected message key
      const decryptedSignature = this.cryptoService.decrypt(signature, nonce, messageKey, this.BASE_64, this.BASE_64);

      // then the validate signature needs the nonce and message key before it can validate signature
      const EMLwithNonce = this.cryptoService.hash(encryptedMessageLink + nonce.toString());

      // check the signature
      const signed = this.keyManager.verifySignature(
        decryptedSignature,
        EMLwithNonce,
        channelMember.contact.signingKey,
      );

      if (!signed) {
        throw new BadRequestException('message not correctly signed');
      } else {
        Logger.debug('signature valid');

        // get the raw message
        const rawMessage = await this.getRawMessage(encryptedMessageLink, nonce, messageKey);

        // the message is an incoming message, so set up the Channel Message object
        const newChannelMessage = await this.createMessage(channelMember, rawMessage, nonce);

        // associate the message with the event
        newChannelMessage.ekhoEvent = messageEvent;

        // update the channel member
        const updatedChannelMember = await this.updateChannelMemberDetails(channelMember, nonce);

        Logger.debug('saving message to database');
        // update the db
        await getManager().transaction(async transactionalEntityManager => {
          await transactionalEntityManager.save(newChannelMessage);
          await transactionalEntityManager.save(updatedChannelMember);
        });

        // output the raw message
        const rawMessageContents = new RawMessageDto();
        rawMessageContents.messageContents = newChannelMessage.messageContents;

        return rawMessageContents;
      }
    }
  }

  // creates a message chain key
  private async createMessageChainKey(sharedSecret: string): Promise<string> {
    Logger.debug('creating message chain key');

    const chainKeyId = this.CHAIN_KEY_ID;
    const chainKeyContext = this.CHAIN_KEY_CONTEXT;
    const messageChainKey = this.cryptoService.deriveSymmetricKeyfromSecret(sharedSecret, chainKeyId, chainKeyContext);
    return messageChainKey;
  }

  // creates a channel key
  private async createChannelKey(sharedSecret: string): Promise<string> {
    Logger.debug('creating channel key');

    return this.cryptoService.hash(sharedSecret + sharedSecret);
  }

  // creates a shared secret
  private async createSharedSecret(channelContact: Contact): Promise<string> {
    Logger.debug('creating shared secret');

    return this.cryptoService.generateECDHSharedSecret(channelContact.oneuseKey, channelContact.handshakePrivateKey);
  }

  // creates a channel identifier
  private async createChannelIdentifier(signingKey: string, channelKey: string, nonce: number): Promise<string> {
    Logger.debug('creating channel identifier');

    return this.cryptoService.shortHash(signingKey + channelKey + nonce, channelKey);
  }

  // creates a channel member
  private async createChannelMember(
    user: User,
    contact: Contact,
    channel: Channel,
    secret: string,
  ): Promise<ChannelMember> {
    Logger.debug('creating channel member');

    const newChannelMember = new ChannelMember();
    newChannelMember.messageChainKey = await this.createMessageChainKey(secret);
    newChannelMember.channel = channel;

    if (user) {
      Logger.debug('... for user id ', user.id.toString());

      const userPublicKey = await this.keyManager.readPublicSigningKey(user.id);

      newChannelMember.nextChannelIdentifier = await this.createChannelIdentifier(
        userPublicKey,
        channel.channelKey,
        this.INITIAL_NONCE,
      );
      newChannelMember.user = user;
      newChannelMember.contact = null;
    }

    if (contact) {
      Logger.debug('... for contact id ', contact.id.toString());

      newChannelMember.nextChannelIdentifier = await this.createChannelIdentifier(
        contact.signingKey,
        channel.channelKey,
        this.INITIAL_NONCE,
      );
      newChannelMember.user = null;
      newChannelMember.contact = contact;
    }

    return newChannelMember;
  }

  // creates link between user and channel for broadcasts
  private async linkBroadcastChannel(
    name: string,
    secret: string,
    user: User,
    channel: Channel,
  ): Promise<BroadcastChannel> {
    Logger.debug('creating broadcast channel link');

    const newBroadCast = new BroadcastChannel();
    newBroadCast.broadcastKey = secret;
    newBroadCast.channel = channel;
    newBroadCast.user = user;
    return newBroadCast;
  }

  // creates a channel
  private async createChannel(name: string, secret: string): Promise<Channel> {
    Logger.debug('creating channel ', name);

    const newChannel = new Channel();
    newChannel.name = name;
    newChannel.channelKey = await this.createChannelKey(secret);
    return newChannel;
  }

  // Gets the current expected nonce for a channel member
  private async getExpectedMessageNonceByChannelMemberId(id: number): Promise<number> {
    Logger.debug('getting expected nonce for channel member ', id.toString());

    const latestChannelMessage = await getRepository(ChannelMessage)
      .createQueryBuilder('ChannelMessage')
      .select('MAX(ChannelMessage.nonce)', 'maxnonce')
      .where('"ChannelMessage"."channelMemberId" = :id', { id })
      .groupBy('"ChannelMessage"."channelMemberId"')
      .getRawOne();

    if (latestChannelMessage) {
      return latestChannelMessage.maxnonce + 1;
    } else {
      Logger.debug('no messages found, getting default nonce');

      // we have no messages, no next message will be nonce 1
      return 1;
    }
  }

  // finds a contact channel member (if any) for a provided channel identifier
  private async findChannelMemberbyNextChannelIdentifier(identifier: string): Promise<ChannelMember[]> {
    Logger.debug('searching for channel member...');

    return this.channelMemberRepository.find({
      relations: ['user', 'contact', 'channel'],
      where: { contactId: !IsNull(), userId: IsNull(), nextChannelIdentifier: identifier },
    });
  }

  // ratchets the message chain key to get the message key
  private async getMessageKey(messageChainKey: string): Promise<string> {
    Logger.debug('getting message key');

    return this.cryptoService.hash(messageChainKey + this.MESSAGE_KEY_RATCHET);
  }

  // returns the raw data (string for moment) from an encrypted IPFS link
  private async getRawMessage(encryptedLink: string, nonce: number, key: string): Promise<string> {
    Logger.debug('getting IPFS address');

    const rawMessageLink = this.cryptoService.decrypt(encryptedLink, nonce, key, this.BASE_64, this.UTF_8);
    const rawMessageEncrypted = (await this.ipfsService.retrieve(rawMessageLink)).content;
    const rawMessage = this.cryptoService.decrypt(rawMessageEncrypted, nonce, key, this.BASE_64, this.UTF_8);
    return rawMessage;
  }

  // ratchets the chain key for forward secrecy
  private async ratchetChainKey(chainKey: string): Promise<string> {
    Logger.debug('ratcheting chain key');

    return this.cryptoService.hash(chainKey + this.CHAIN_KEY_RATCHET);
  }

  // updates the channel member's next channel identifier
  private async updateChannelMemberDetails(member: ChannelMember, nonce: number): Promise<ChannelMember> {
    Logger.debug('updating channel member ', member.id.toString());

    member.messageChainKey = await this.ratchetChainKey(member.messageChainKey);
    member.nextChannelIdentifier = await this.createChannelIdentifier(
      member.contact.signingKey,
      member.channel.channelKey,
      nonce + 1,
    );
    return member;
  }

  // create a channel message entity
  private async createMessage(member: ChannelMember, message: string, nonce: number): Promise<ChannelMessage> {
    Logger.debug('creating channel message');

    const channelMessage = new ChannelMessage();
    channelMessage.channelMember = member;
    channelMessage.messageContents = message;
    channelMessage.nonce = nonce;
    return channelMessage;
  }

  // *** External Delivery methods ***

  // sends encrypted data to IPFS
  private async sendToIpfs(message): Promise<string> {
    try {
      Logger.debug('sharing via IPFS');

      // Send the encrypted message to IPFS - get back the IPFS hash
      const ipfsMessage = new IpfsMessageDto();
      ipfsMessage.content = message;
      const messageLink = await this.ipfsService.store(ipfsMessage);

      return messageLink;
    } catch (e) {
      throw e;
    }
  }

  // sends ekho event to chain
  private async sendToChain(channelId: string, link: string, signature: string): Promise<boolean> {
    try {
      Logger.debug('emitting event to chain');

      const ekho: EkhoEventDto = new EkhoEventDto();
      ekho.channelIdentifier = channelId;
      ekho.encryptedMessageLink = link;
      ekho.encryptedMessageLinkSignature = signature;

      await this.web3Service.emitEkho(ekho);

      return true;
    } catch (e) {
      throw e;
    }
  }

  /* #region Excessive search methods */
  /**
   * Finds all channel member records for a given contact id
   * @param id contact id
   */
  async findAllChannelMembersByContactId(id: number): Promise<ChannelMember[]> {
    return this.channelMemberRepository.find({
      where: { contactId: id },
    });
  }

  /**
   * Find all channel member records for a given user id
   * @param id user id
   */
  async findAllChannelMembersByUserId(id: number): Promise<ChannelMember[]> {
    return this.channelMemberRepository.find({
      relations: ['channel'],
      where: { user: { id } },
    });
  }

  /**
   * Find all channel members for a given channel id
   * @param id channel id
   * @returns ChannelMember[] array of channel members in the channel
   */
  async findAllChannelMembersByChannelId(id: number): Promise<ChannelMember[]> {
    return this.channelMemberRepository.find({
      where: { channelId: id },
    });
  }

  /**
   * Returns all channel messages by channel id
   * @param id Channel id
   * @returns ChannelMessage[] list of channel messages (includes all child relationships)
   */
  async findAllChannelMessagesByChannelId(id: number): Promise<ChannelMessage[]> {
    const channelMessages = this.channelMessageRepository.find({
      relations: ['channelMember', 'channelMember.channel', 'channelMember.user', 'channelMember.contact'],
      where: { 'channelMember.channel.channelid': id },
    });
    return channelMessages;
  }
  /* #endregion */
}
