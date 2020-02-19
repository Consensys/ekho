import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getManager, getRepository, IsNull, Repository } from 'typeorm';
import { Contact } from '../contacts/contacts.entity';
import { ContactsService } from '../contacts/contacts.service';
import { CryptographyService } from '../cryptography/cryptography.service';
import EkhoEventDto from '../events/dto/ekhoevent.dto';
import { EventsService } from '../events/events.service';
import { IpfsMessageDto } from '../ipfs/dto/ipfs-message.dto';
import { IpfsService } from '../ipfs/ipfs.service';
import { User } from '../users/entities/users.entity';
import { UsersService } from '../users/users.service';
import { VaultService } from '../vault/vault.service';
import { Web3Service } from '../web3/web3.service';
import ChannelMemberDto from './dto/channelmember.dto';
import CreateChannelDto from './dto/create-channel.dto';
import EncodedMessageDto from './dto/encodedmessage.dto';
import RawMessageDto from './dto/rawmessage.dto';
import { ChannelMember } from './entities/channelmembers.entity';
import { ChannelMessage } from './entities/channelmessages.entity';
import { Channel } from './entities/channels.entity';

@Injectable()
export class ChannelsService {
  private readonly BASE_64 = 'base64';
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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    private readonly userService: UsersService,
    private readonly contactService: ContactsService,
    private readonly cryptoService: CryptographyService,
    private readonly vaultService: VaultService,
    private readonly ipfsService: IpfsService,
    private readonly web3Service: Web3Service,
    private readonly eventService: EventsService,
  ) {}

  // *** Functional Methods ***

  // Process all pending blockchain events in DB
  async processAllPendingEvents(): Promise<number> {
    let eventsProcessed = 0;
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
          } catch (e) {
            Logger.debug('Event could not be decoded', unprocessedEvent.eventIdentifier.toString());
          } finally {
            await this.eventService.markEventAsProcessed(unprocessedEvent.eventIdentifier);
            eventsProcessed++;
          }
        } else {
          completed = true;
          Logger.debug('no unprocessed events');
          Logger.debug('events processed: ', eventsProcessed.toString());
        }
      }
    } catch (e) {
      Logger.debug('Error getting unprocessed events ', e.message);
      throw e;
    }
    return eventsProcessed;
  }

  // Create a channel message
  async createChannelMessage(channelMessage: RawMessageDto): Promise<EncodedMessageDto> {
    Logger.debug('Sending channel message for user ', channelMessage.userId.toString());

    // get the channel member
    const channelMember = await this.findChannelMemberByUserAndChannel(channelMessage.userId, channelMessage.channelId);

    // get the user - fail if they don't exist
    // TODO change this to a user & channel passed in aand get the channelmemberid from that
    const messageSender = await this.userService.findById(channelMember.user.id, true);

    // get next expected message nonce
    const nonce = await this.getExpectedMessageNonceByChannelMemberId(channelMember.id);

    // the message is coming from the user, so it's an outgoing message
    const newChannelMessage = await this.createMessage(channelMember, channelMessage.messageContents, nonce);

    // Get the Channel Identifier for the message
    const channelIdentifier = await this.createChannelIdentifier(
      messageSender.publicSigningKey,
      channelMember.channel.channelKey,
      nonce,
    );

    // Get the message key
    const messageKey = await this.getMessageKey(channelMember.messageChainKey);

    // encrypt the message
    const newEncryptedMessage = this.cryptoService.encrypt(newChannelMessage.messageContents, nonce, messageKey);

    // send the message to IPFS
    const messageLink = await this.sendToIpfs(newEncryptedMessage);

    // encrypt the IPFS hash with the message key
    const encryptedMessageLink = this.cryptoService.encrypt(messageLink, nonce, messageKey);

    // sign the encrypted IPFS hash with the user signing key
    const encryptedMessageLinkSignature = await this.vaultService.sign(messageSender.id, encryptedMessageLink);

    // send the blockchain transaction
    const mined = await this.sendToChain(channelIdentifier, encryptedMessageLink, encryptedMessageLinkSignature);

    // sacrifice a chicken in the hope that this has been successful
    if (mined) {
      // Update the member message chain key
      channelMember.messageChainKey = await this.ratchetChainKey(channelMember.messageChainKey);

      // Update the member next channel identifier
      channelMember.nextChannelIdentifier = await this.createChannelIdentifier(
        messageSender.publicSigningKey,
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
      encodedMessage.encryptedMessageLinkSignature = encryptedMessageLinkSignature;
      return encodedMessage;
    }
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
  async findChannelMessageById(id: number): Promise<ChannelMessage> {
    return this.channelMessageRepository.findOneOrFail({
      relations: ['channelmember'],
      where: { id },
    });
  }

  // Finds all channel messages (TODO: for user id)
  async findAllChannelMessages(): Promise<ChannelMessage[]> {
    return this.channelMessageRepository.find({ relations: ['channelmember'] });
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

    // check the signature
    const signed = this.cryptoService.validateSignature(
      signature,
      encryptedMessageLink,
      channelMember.contact.signingKey,
    );

    if (!signed) {
      throw new BadRequestException('message not correctly signed');
    } else {
      Logger.debug('signature valid');

      // get the message key
      const messageKey = await this.getMessageKey(channelMember.messageChainKey);

      // get next expected message nonce
      const nonce = await this.getExpectedMessageNonceByChannelMemberId(channelMember.id);

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

  private async createMessageChainKey(sharedSecret: string): Promise<string> {
    Logger.debug('creating message chain key');

    const chainKeyId = this.CHAIN_KEY_ID;
    const chainKeyContext = this.CHAIN_KEY_CONTEXT;
    const messageChainKey = this.cryptoService.deriveSymmetricKeyfromSecret(sharedSecret, chainKeyId, chainKeyContext);
    return messageChainKey;
  }

  private async createChannelKey(sharedSecret: string): Promise<string> {
    Logger.debug('creating channel key');

    return this.cryptoService.generateSHA256Hash(sharedSecret + sharedSecret);
  }

  private async createSharedSecret(channelContact: Contact): Promise<string> {
    Logger.debug('creating shared secret');

    return this.cryptoService.generateECDHSharedSecret(channelContact.oneuseKey, channelContact.handshakePrivateKey);
  }

  private async createChannelIdentifier(signingKey: string, channelKey: string, nonce: number): Promise<string> {
    Logger.debug('creating channel identifier');

    return this.cryptoService.generateSHA256Hash(signingKey + channelKey + nonce);
  }

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

      newChannelMember.nextChannelIdentifier = await this.createChannelIdentifier(
        user.publicSigningKey,
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

  private async createChannel(name: string, secret: string): Promise<Channel> {
    Logger.debug('creating channel ', name);

    const newChannel = new Channel();
    newChannel.name = name;
    newChannel.channelKey = await this.createChannelKey(secret);
    return newChannel;
  }

  // Updates Channel Member (specifically *just* the Message Chain Key)
  private async updateChannelMember(channelMember: ChannelMemberDto): Promise<ChannelMember> {
    Logger.debug('updating message chain key for channel member ', channelMember.id.toString());

    const updatedChannelMember = new ChannelMember();
    updatedChannelMember.messageChainKey = channelMember.messageChainKey;
    await this.channelMemberRepository.save(updatedChannelMember);
    return updatedChannelMember;
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

  private async findChannelMemberbyNextChannelIdentifier(identifier: string): Promise<ChannelMember> {
    Logger.debug('searching for channel member...');

    return this.channelMemberRepository.findOneOrFail({
      relations: ['user', 'contact', 'channel'],
      where: { contactId: !IsNull(), userId: IsNull(), nextChannelIdentifier: identifier },
    });
  }

  private async getMessageKey(messageChainKey: string): Promise<string> {
    Logger.debug('getting message key');

    return this.cryptoService.generateSHA256Hash(messageChainKey + this.MESSAGE_KEY_RATCHET);
  }

  private async getRawMessage(encryptedLink: string, nonce: number, key: string): Promise<string> {
    Logger.debug('getting IPFS address');

    const rawMessageLink = this.cryptoService.decrypt(encryptedLink, nonce, key);
    const rawMessageEncrypted = (await this.ipfsService.retrieve(rawMessageLink)).content;
    const rawMessage = this.cryptoService.decrypt(rawMessageEncrypted, nonce, key);
    return rawMessage;
  }

  private async ratchetChainKey(chainKey: string): Promise<string> {
    Logger.debug('ratcheting chain key');

    return this.cryptoService.generateSHA256Hash(chainKey + this.CHAIN_KEY_RATCHET);
  }

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

  private async createMessage(member: ChannelMember, message: string, nonce: number): Promise<ChannelMessage> {
    Logger.debug('creating channel message');

    const channelMessage = new ChannelMessage();
    channelMessage.channelMember = member;
    channelMessage.messageContents = message;
    channelMessage.nonce = nonce;
    return channelMessage;
  }

  // *** External Delivery methods ***

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
