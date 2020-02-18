import { Injectable, Logger, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { throwError } from 'rxjs';
import { Contact } from 'src/contacts/contacts.entity';
import { ContactsService } from 'src/contacts/contacts.service';
import { CryptographyService } from 'src/cryptography/cryptography.service';
import EkhoEventDto from 'src/events/dto/ekhoevent.dto';
import { EventsService } from 'src/events/events.service';
import { IpfsMessageDto } from 'src/ipfs/dto/ipfs-message.dto';
import { IpfsService } from 'src/ipfs/ipfs.service';
import { User } from 'src/users/entities/users.entity';
import { UsersService } from 'src/users/users.service';
import { Web3Service } from 'src/web3/web3.service';
import { FindManyOptions, FindOneOptions, getManager, getRepository, IsNull, Repository } from 'typeorm';
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
    private readonly ipfsService: IpfsService,
    private readonly web3Service: Web3Service,
    private readonly eventService: EventsService,
  ) {}

  async processAllPendingEvents(): Promise<number> {
    let eventsProcessed = 0;
    let completed: boolean = false;
    try {
      while (!completed) {
        const unprocessedEvent: EkhoEventDto = await this.eventService.getFirstUnprocessedEvent();
        if (unprocessedEvent) {
          const incomingMessage = new EncodedMessageDto();
          incomingMessage.channelIdentifier = unprocessedEvent.channelIdentifier;
          incomingMessage.encryptedMessageLink = unprocessedEvent.encryptedMessageLink;
          incomingMessage.encryptedMessageLinkSignature = unprocessedEvent.encryptedMessageLinkSignature;

          try {
            const message: RawMessageDto = await this.decodeChannelMessage(incomingMessage);
            Logger.debug('Found message from channel member! ', message.channelMemberId.toString());
          } catch (e) {
            Logger.debug('Event could not be decoded', unprocessedEvent.eventIdentifier.toString());
          } finally {
            await this.eventService.markEventAsProcessed(unprocessedEvent.eventIdentifier);
            eventsProcessed++;
          }
        } else {
          completed = true;
          Logger.debug('Number of events processed: ', eventsProcessed.toString());
        }
      }
    } catch (e) {
      Logger.debug('Error getting unprocessed events ', e.message);
      throw e;
    }
    return eventsProcessed;
  }

  /* #region ChannelMember */
  /**
   * Updates Channel Member (specifically *just* the Message Chain Key)
   * @param channelMember channel Member to update
   * @returns ChannelMember updated Channel Member entity
   */
  async updateChannelMember(channelMember: ChannelMemberDto): Promise<ChannelMember> {
    const updatedChannelMember = new ChannelMember();
    updatedChannelMember.messageChainKey = channelMember.messageChainKey;
    await this.channelMemberRepository.save(updatedChannelMember);
    return updatedChannelMember;
  }

  /**
   * Deletes a Channel Member
   * @param id Channel Member to delete
   */
  async deleteChannelMember(id: number): Promise<void> {
    await this.channelMemberRepository.delete({ id });
  }

  /**
   * Finds one record based on search criteria
   * @param findClause JSON find clause to return one channel member record
   */
  async findOneChannelMember(findClause: FindOneOptions<ChannelMember>): Promise<ChannelMember> {
    return this.channelMemberRepository.findOneOrFail(findClause);
  }

  /**
   * Finds one channel member by id
   * @param id Channel member id to find
   * @returns ChannelMember channelmember entity returned
   */
  async findChannelMemberById(id: number): Promise<ChannelMember> {
    return this.findOneChannelMember({
      relations: ['channel', 'contact', 'user'],
      where: { id },
    });
  }

  /**
   * Finds all records based on search criteria
   * @param findClause JSON find clause to return many channel member records
   */
  async findAllChannelMembers(findClause: FindManyOptions<ChannelMember>): Promise<ChannelMember[]> {
    return this.channelMemberRepository.find(findClause);
  }
  /* #endregion */

  /* #region Excessive search methods */
  /**
   * Finds all channel member records for a given contact id
   * @param id contact id
   */
  async findAllChannelMembersByContactId(id: number): Promise<ChannelMember[]> {
    return this.findAllChannelMembers({
      where: { contactId: id },
    });
  }

  /**
   * Find all channel member records for a given user id
   * @param id user id
   */
  async findAllChannelMembersByUserId(id: number): Promise<ChannelMember[]> {
    return this.findAllChannelMembers({
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

  private async createMessageChainKey(sharedSecret: string): Promise<string> {
    const chainKeyId = this.CHAIN_KEY_ID;
    const chainKeyContext = this.CHAIN_KEY_CONTEXT;
    const messageChainKey = this.cryptoService.deriveSymmetricKeyfromSecret(sharedSecret, chainKeyId, chainKeyContext);
    return messageChainKey;
  }

  private async createChannelKey(sharedSecret: string): Promise<string> {
    return this.cryptoService.generateSHA256Hash(sharedSecret + sharedSecret);
  }

  private async createSharedSecret(channelContact: Contact): Promise<string> {
    return this.cryptoService.generateECDHSharedSecret(channelContact.oneuseKey, channelContact.handshakePrivateKey);
  }

  private async createNextChannelIdentifier(signingKey: string, channelKey: string): Promise<string> {
    const initialNonce = 1;
    return this.cryptoService.generateSHA256Hash(signingKey + channelKey + initialNonce);
  }

  private async createChannelMember(
    user: User,
    contact: Contact,
    channel: Channel,
    secret: string,
  ): Promise<ChannelMember> {
    const newChannelMember = new ChannelMember();
    newChannelMember.messageChainKey = await this.createMessageChainKey(secret);
    newChannelMember.channel = channel;

    if (user) {
      newChannelMember.nextChannelIdentifier = await this.createNextChannelIdentifier(
        user.publicSigningKey,
        channel.channelKey,
      );
      newChannelMember.user = user;
      newChannelMember.contact = null;
    }

    if (contact) {
      newChannelMember.nextChannelIdentifier = await this.createNextChannelIdentifier(
        contact.signingKey,
        channel.channelKey,
      );
      newChannelMember.user = null;
      newChannelMember.contact = contact;
    }

    return newChannelMember;
  }

  private async createChannel(name: string, secret: string): Promise<Channel> {
    const newChannel = new Channel();
    newChannel.name = name;
    newChannel.channelKey = await this.createChannelKey(secret);
    return newChannel;
  }
  /**
   * Creates a channel
   * @param channel channel to be created
   * @returns Channel - created channel entity
   */
  async createChannelAndMembers(channel: CreateChannelDto): Promise<Channel> {
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

    // 8. return the saved channel
    return await this.findChannelById(newChannel.id);
  }

  /**
   * Deletes a channel
   * @param id channel id
   */
  async deleteChannel(id: number): Promise<void> {
    await this.channelRepository.delete({ id });
  }

  /**
   * Finds one channel using flexible where clause
   * @param findClause JSON find clause to return one channel record
   * @returns Channel entity containing channel information
   */
  async findOneChannel(findClause: FindOneOptions<Channel>): Promise<Channel> {
    return this.channelRepository.findOneOrFail(findClause);
  }

  async getAllChannels(): Promise<Channel[]> {
    return this.channelRepository.find({ relations: ['channelmembers'] });
  }

  /**
   * Finds a channel by exact name match
   * @param name Name of channel to be retrieved
   * @returns Channel entity containing channel information
   */
  async findChannelByName(name: string): Promise<Channel> {
    return this.channelRepository.findOne({
      relations: ['channelmembers'],
      where: { name },
    });
  }

  /**
   * Finds a channel by its channel id
   * @param id channel Id to be retrieved
   * @returns Channel entity containing channel information
   */
  async findChannelById(id: number): Promise<Channel> {
    return this.channelRepository.findOne({
      relations: ['channelmembers'],
      where: { id },
    });
  }

  /**
   * Finds one channel message using flexible where clause
   * @param findClause JSON find clause to return one channel message record
   * @returns Channel message entity containing channel message information
   */
  async findOneChannelMessage(findClause: FindOneOptions<ChannelMessage>): Promise<ChannelMessage> {
    return this.channelMessageRepository.findOneOrFail(findClause);
  }

  /**
   * Finds a channelmessage  by its channel message id
   * @param id channel message Id to be retrieved
   * @returns Channel message entity containing channel message information
   */
  async findChannelMessageById(id: number): Promise<ChannelMessage> {
    return this.channelMessageRepository.findOne({
      where: { id },
    });
  }

  /**
   * Gets the current highest nonce for a channel member
   * @param id channel member id
   * @returns number current highest nonce for that channel member
   */
  private async getLatestMessageNonceByChannelMemberId(id: number): Promise<number> {
    const latestChannelMessage = await getRepository(ChannelMessage)
      .createQueryBuilder('ChannelMessage')
      .select('MAX(ChannelMessage.nonce)', 'maxnonce')
      .where('"ChannelMessage"."channelMemberId" = :id', { id })
      .groupBy('"ChannelMessage"."channelMemberId"')
      .getRawOne();

    if (latestChannelMessage) {
      return latestChannelMessage.maxnonce;
    } else {
      return 0;
    }
  }

  private async getChannelMemberByChannelIdentifier(channelIdentifier: string): Promise<ChannelMember> {
    return this.findChannelMemberbyNextChannelIdentifier(channelIdentifier);
  }

  async findChannelMemberbyNextChannelIdentifier(identifier: string): Promise<ChannelMember> {
    return this.channelMemberRepository.findOne({
      relations: ['user', 'contact', 'channel'],
      where: { contactId: !IsNull(), userId: IsNull(), nextChannelIdentifier: identifier },
    });
  }

  async decodeChannelMessage(channelMessage: EncodedMessageDto): Promise<RawMessageDto> {
    // todo this will only work for contacts in channels, which makes sense as they're incoming,
    // but likely to create edge conditions with multitenancy

    // break up the message into its parts
    const channelIdentifier = channelMessage.channelIdentifier;
    const encryptedMessageLink = channelMessage.encryptedMessageLink;
    const signature = channelMessage.encryptedMessageLinkSignature;

    // find the channel member
    const channelMember = await this.findChannelMemberbyNextChannelIdentifier(channelIdentifier);
    if (!channelMember) {
      throw new Error('Channel identifier unknown');
    }

    // get existing nonce
    const previousNonce = await this.getLatestMessageNonceByChannelMemberId(channelMember.id);
    const currentNonce = previousNonce + 1;
    const nextNonce = currentNonce + 1;

    // check the signature
    const signed = this.cryptoService.validateSignature(
      signature,
      encryptedMessageLink,
      channelMember.contact.signingKey,
    );

    if (signed) {
      // ratchet the message key
      const messageKey = this.cryptoService.generateSHA256Hash(
        channelMember.messageChainKey + this.MESSAGE_KEY_RATCHET,
      );

      // decrypt the message (using next nonce)
      const rawMessageLink = this.cryptoService.decrypt(encryptedMessageLink, currentNonce, messageKey);
      const rawMessageEncrypted = (await this.ipfsService.retrieve(rawMessageLink)).content;
      const rawMessage = this.cryptoService.decrypt(rawMessageEncrypted, currentNonce, messageKey);

      // the message is an incoming message, so set up the Channel Message object
      const newChannelMessage = new ChannelMessage();
      newChannelMessage.channelMember = channelMember;
      newChannelMessage.messageContents = rawMessage;

      // increment the nonce so it's right for the current message
      newChannelMessage.nonce = currentNonce;

      // update the channel member
      const updatedChannelMember = channelMember;

      // ratchet the chain key
      updatedChannelMember.messageChainKey = this.cryptoService.generateSHA256Hash(
        updatedChannelMember.messageChainKey + this.CHAIN_KEY_RATCHET,
      );

      // update the next channel identifier expected
      updatedChannelMember.nextChannelIdentifier = this.cryptoService.generateSHA256Hash(
        channelMember.contact.signingKey + channelMember.channel.channelKey + nextNonce,
      );

      // update the db
      await getManager().transaction(async transactionalEntityManager => {
        await transactionalEntityManager.save(newChannelMessage);
        await transactionalEntityManager.save(updatedChannelMember);
      });

      // output the raw message
      const rawMessageContents = new RawMessageDto();
      rawMessageContents.messageContents = newChannelMessage.messageContents;
      rawMessageContents.channelMemberId = channelMember.id;
      return rawMessageContents;
    } else {
      throw NotAcceptableException;
    }

    return null;
  }

  /**
   * Creates a channel message
   * @param channelMessage message to create
   * @returns ChannelMessage created entity
   */
  async createChannelMessage(channelMessage: RawMessageDto): Promise<EncodedMessageDto> {
    // Get highest nonce for this channel member
    const previousNonce = await this.getLatestMessageNonceByChannelMemberId(channelMessage.channelMemberId);
    const currentNonce = previousNonce + 1;
    const nextNonce = currentNonce + 1;

    // get the channel member
    const channelMember = await this.findChannelMemberById(channelMessage.channelMemberId);
    if (!channelMember) {
      throw NotFoundException;
    }

    // get the user - fail if they don't exist
    // TODO change this to a user & channel passed in aand get the channelmemberid from that
    const messageSender = this.userService.findById(channelMember.user.id, true);
    if (!messageSender) {
      throw NotFoundException;
    }

    // the message is coming from the user, so it's an outgoing message
    const newChannelMessage = new ChannelMessage();
    newChannelMessage.channelMember = channelMember;
    newChannelMessage.messageContents = channelMessage.messageContents;
    newChannelMessage.nonce = currentNonce;

    // Get the message key
    const newMessageKey = this.cryptoService.generateSHA256Hash(
      channelMember.messageChainKey + this.MESSAGE_KEY_RATCHET,
    );

    const newEncryptedMessage = this.cryptoService.encrypt(
      newChannelMessage.messageContents,
      currentNonce,
      newMessageKey,
    );

    // Get the Channel Identifier for the message
    const userPublicSigningKey = (await messageSender).publicSigningKey;
    const channelKey = channelMember.channel.channelKey;
    const newChannelIdentifier = this.cryptoService.generateSHA256Hash(
      userPublicSigningKey + channelKey + currentNonce,
    );

    // Get the next channel identifier
    channelMember.nextChannelIdentifier = this.cryptoService.generateSHA256Hash(
      userPublicSigningKey + channelKey + nextNonce,
    );

    // 5. Send the encrypted message to IPFS - get back the IPFS hash
    const ipfsMessage = new IpfsMessageDto();
    ipfsMessage.content = newEncryptedMessage;

    Logger.debug('saving message to IPFS');
    const messageLink = await this.ipfsService.store(ipfsMessage);

    // encrypt the IPFS hash with the message key
    const encryptedMessageLink = this.cryptoService.encrypt(messageLink, currentNonce, newMessageKey);

    // sign the encrypted IPFS hash with the user signing key
    const encryptedMessageLinkSignature = this.cryptoService.generateSignature(
      encryptedMessageLink,
      (await messageSender).privateSigningKey,
    );

    try {
      // send the blockchain transaction
      await this.web3Service.emitEvent(newChannelIdentifier, encryptedMessageLink, encryptedMessageLinkSignature);
      // Update the message chain key
      channelMember.messageChainKey = this.cryptoService.generateSHA256Hash(
        channelMember.messageChainKey + this.CHAIN_KEY_RATCHET,
      );

      // save the channel member & message details
      await getManager().transaction(async transactionalEntityManager => {
        await transactionalEntityManager.save(newChannelMessage);
        await transactionalEntityManager.save(channelMember);
      });

      // return the encoded message
      const encodedMessage = new EncodedMessageDto();
      encodedMessage.channelIdentifier = newChannelIdentifier;
      encodedMessage.encryptedMessageLink = encryptedMessageLink;
      encodedMessage.encryptedMessageLinkSignature = encryptedMessageLinkSignature;
      return encodedMessage;
    } catch (e) {
      Logger.debug('transaction failed!', (e as Error).message);
      throwError('blockchain fail!');
    }
  }
}
