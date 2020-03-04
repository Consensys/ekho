import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
import CreateBroadcastChannelListenerDto from './dto/create-broadcastchannellistener.dto';
import CreateChannelDto from './dto/create-channel.dto';
import EncodedMessageDto from './dto/encodedmessage.dto';
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
  async processAllPendingEvents(): Promise<ProcessReport> {
    const processReport = new ProcessReport();
    processReport.receivedMessages = 0;
    processReport.processedTotal = 0;
    processReport.receivedMessageEvents = [];

    let completed: boolean = false;
    Logger.debug('Processing pending events');
    try {
      while (!completed) {
        const unprocessedEvent: EkhoEventDto = await this.eventService.getFirstUnprocessedEvent();
        if (unprocessedEvent) {
          const incomingMessage = new EncodedMessageDto();
          incomingMessage.channelIdentifier = unprocessedEvent.channelIdentifier;
          incomingMessage.encryptedMessageLink = unprocessedEvent.encryptedMessageLink;
          incomingMessage.encryptedMessageLinkSignature = unprocessedEvent.encryptedMessageLinkSignature;

          try {
            const message: RawMessageDto = await this.validateAndDecryptEvent(incomingMessage);
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
    const EMLwithNonce = this.cryptoService.generateSHA256Hash(encryptedMessageLink + nonce.toString());

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

  // Creates a broadcast channel listener
  async createBroadcastChannelListener(channel: CreateBroadcastChannelListenerDto): Promise<Channel> {
    Logger.debug('creating broadcast channel listener');

    // 1. get user (fail if not found)
    await this.userService.findById(channel.userId);

    // 2. get contact (must be owned by user)
    const channelContact = await this.contactService.findOneContact(channel.userId, channel.contactId);

    // 3. get the provided channel secret
    const sharedSecret = channel.key;

    // 4. create channel
    const newChannel = await this.createChannel(channel.name, sharedSecret);

    // 5. create channelmember for contact
    const userChannelMember = await this.createChannelMember(null, channelContact, newChannel, sharedSecret);

    // 7. save everything (in a transaction)
    await getManager().transaction(async transactionalEntityManager => {
      await transactionalEntityManager.save(newChannel);
      await transactionalEntityManager.save(userChannelMember);
    });

    Logger.debug('broadcast channel listener created ', newChannel.id.toString());

    // 8. return the saved channel
    return await this.findChannelById(newChannel.id);
  }

  // Create a channel and members
  async createBroadcastChannel(channel: CreateBroadcastChannelDto): Promise<BroadcastChannelDto> {
    Logger.debug('creating broadcast channel');

    // 1. get user
    const channelUser = await this.userService.findById(channel.userId);

    // 3. create shared secret
    const sharedSecret = await this.cryptoService.generateRandomBytes().toString(this.BASE_64);

    // 4. create channel
    const newChannel = await this.createChannel(channel.name, sharedSecret);

    // 5. create channelmember for user
    const userChannelMember = await this.createChannelMember(channelUser, null, newChannel, sharedSecret);

    // 6. create Broadcast Channel for user
    const broadcastChannel = await this.linkBroadcastChannel(channel.name, sharedSecret, channelUser, newChannel);

    // 7. save everything (in a transaction)
    await getManager().transaction(async transactionalEntityManager => {
      await transactionalEntityManager.save(newChannel);
      await transactionalEntityManager.save(userChannelMember);
      await transactionalEntityManager.save(broadcastChannel);
    });

    Logger.debug('broadcast channel created ', newChannel.id.toString());

    // 8. return the broadcast channel details
    const newBroadcastChannel = new BroadcastChannelDto();
    newBroadcastChannel.name = channel.name;
    newBroadcastChannel.channelId = newChannel.id;
    newBroadcastChannel.userId = channel.userId;
    newBroadcastChannel.broadcastKey = sharedSecret;

    return newBroadcastChannel;
  }

  // Get a specified user's broadcast channels
  async getBroadcastChannels(userId: number): Promise<BroadcastChannel[]> {
    return this.broadcastChannelRepository.find({
      relations: ['channel', 'user'],
      where: { user: userId },
    });
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
  private async validateAndDecryptEvent(channelMessage: EncodedMessageDto): Promise<RawMessageDto> {
    Logger.debug('validating and decrypting event');

    // break up the message into its parts
    const channelIdentifier = channelMessage.channelIdentifier;
    const encryptedMessageLink = channelMessage.encryptedMessageLink;
    const signature = channelMessage.encryptedMessageLinkSignature;

    // find the channel member
    const channelMember = await this.findChannelMemberbyNextChannelIdentifier(channelIdentifier);

    Logger.debug('found message from channel member ', channelMember.id.toString());

    // get the message key
    const messageKey = await this.getMessageKey(channelMember.messageChainKey);

    // get next expected message nonce
    const nonce = await this.getExpectedMessageNonceByChannelMemberId(channelMember.id);

    // first decrypt the signature with the expected message key
    const decryptedSignature = this.cryptoService.decrypt(signature, nonce, messageKey, this.BASE_64, this.BASE_64);

    // then the validate signature needs the nonce and message key before it can validate signature
    const EMLwithNonce = this.cryptoService.generateSHA256Hash(encryptedMessageLink + nonce.toString());

    // check the signature
    const signed = this.keyManager.verifySignature(decryptedSignature, EMLwithNonce, channelMember.contact.signingKey);

    if (!signed) {
      throw new BadRequestException('message not correctly signed');
    } else {
      Logger.debug('signature valid');

      // get the raw message
      const rawMessage = await this.getRawMessage(encryptedMessageLink, nonce, messageKey);

      // the message is an incoming message, so set up the Channel Message object
      const newChannelMessage = await this.createMessage(channelMember, rawMessage, nonce);

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

    return this.cryptoService.generateSHA256Hash(sharedSecret + sharedSecret);
  }

  // creates a shared secret
  private async createSharedSecret(channelContact: Contact): Promise<string> {
    Logger.debug('creating shared secret');

    return this.cryptoService.generateECDHSharedSecret(channelContact.oneuseKey, channelContact.handshakePrivateKey);
  }

  // creates a channel identifier
  private async createChannelIdentifier(signingKey: string, channelKey: string, nonce: number): Promise<string> {
    Logger.debug('creating channel identifier');

    return this.cryptoService.generateSHA256Hash(signingKey + channelKey + nonce);
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
  private async findChannelMemberbyNextChannelIdentifier(identifier: string): Promise<ChannelMember> {
    Logger.debug('searching for channel member...');

    return this.channelMemberRepository.findOneOrFail({
      relations: ['user', 'contact', 'channel'],
      where: { contactId: !IsNull(), userId: IsNull(), nextChannelIdentifier: identifier },
    });
  }

  // ratchets the message chain key to get the message key
  private async getMessageKey(messageChainKey: string): Promise<string> {
    Logger.debug('getting message key');

    return this.cryptoService.generateSHA256Hash(messageChainKey + this.MESSAGE_KEY_RATCHET);
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

    return this.cryptoService.generateSHA256Hash(chainKey + this.CHAIN_KEY_RATCHET);
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

      await this.web3Service.emitEvent(channelId, link, signature);

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
      where: { userid: id },
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
