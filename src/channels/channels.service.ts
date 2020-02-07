import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { throwError } from 'rxjs';
import { Contact } from 'src/contacts/contacts.entity';
import { ContactsService } from 'src/contacts/contacts.service';
import { CryptographyService } from 'src/cryptography/cryptography.service';
import { CryptographyKeyPairDto } from 'src/cryptography/dto/cryptography-keypair.dto';
import { IpfsMessageDto } from 'src/ipfs/dto/ipfs-message.dto';
import { IpfsService } from 'src/ipfs/ipfs.service';
import { User } from 'src/users/entities/users.entity';
import { UsersService } from 'src/users/users.service';
import { Web3Service } from 'src/web3/web3.service';
import { FindManyOptions, FindOneOptions, getManager, getRepository, Repository } from 'typeorm';
import ChannelMemberDto from './dto/channelmember.dto';
import CreateChannelDto from './dto/create-channel.dto';
import CreateChannelMemberDto from './dto/create-channelmember.dto';
import CreateChannelMessageDto from './dto/create-channelmessage.dto';
import SentMessageDto from './dto/sentmessage.dto';
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
  ) {}

  /* #region ChannelMember */
  /**
   * Creates a Channel Member
   * @param channelMember channel member to be created
   * @returns ChannelMember created ChannelMember entity
   */
  async createChannelMember(channelMember: CreateChannelMemberDto): Promise<ChannelMember> {
    const newChannelMember = new ChannelMember();

    // validate user (might not be present)
    if (channelMember.userId) {
      const channelUser = await this.userService.findById(channelMember.userId);
      newChannelMember.user = channelUser;
    } else {
      newChannelMember.user = null;
    }

    // validate contact (might not be present)
    if (channelMember.contactId) {
      const channelContact = await this.contactService.findOne(channelMember.contactId, null, true);
      newChannelMember.contact = channelContact;
      newChannelMember.contact.id = channelMember.contactId;
    } else {
      newChannelMember.contact = null;
    }

    newChannelMember.channel = await this.findChannelById(channelMember.channelId);
    newChannelMember.messageChainKey = channelMember.messageChainKey;

    await this.channelMemberRepository.save(newChannelMember);
    return newChannelMember;
  }

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

  /* #region Channel */
  /**
   * Creates a channel
   * @param channel channel to be created
   * @returns Channel - created channel entity
   */
  async createChannel(channel: CreateChannelDto): Promise<Channel> {
    // 1. validate user exists
    const channelUser = await this.userService.findById(channel.userId);

    // 2. validate contact exists and is owned by user
    const contactName = channel.contactName;

    let channelContact = new Contact();
    if (contactName) {
      channelContact = await this.contactService.findOne(channel.userId, contactName, true);
    }

    // 3. create channel, channel key & shared secret
    const newChannel = new Channel();
    newChannel.name = channel.name;
    const sharedSecret = this.cryptoService.generateECDHSharedSecret(
      channelContact.oneuseKey,
      channelContact.handshakePrivateKey,
    );
    newChannel.channelKey = this.cryptoService.generateSHA256Hash(sharedSecret + sharedSecret);

    // 3.2 generate MessageChainKey (same for both channel members)
    const chainKeyId = this.CHAIN_KEY_ID;
    const chainKeyContext = this.CHAIN_KEY_CONTEXT;
    const messageChainKey = this.cryptoService.deriveSymmetricKeyfromSecret(sharedSecret, chainKeyId, chainKeyContext);

    // 4. create channelmember for user
    const userChannelMember = new ChannelMember();
    userChannelMember.messageChainKey = messageChainKey;
    userChannelMember.user = channelUser;
    userChannelMember.contact = null;
    userChannelMember.channel = newChannel;

    // 5. create channelmember for contact
    // TODO this will need to handle array of contacts for group channels
    const contactChannelMember = new ChannelMember();
    contactChannelMember.messageChainKey = messageChainKey;
    contactChannelMember.user = null;
    contactChannelMember.contact = channelContact;
    contactChannelMember.channel = newChannel;

    await getManager().transaction(async transactionalEntityManager => {
      await transactionalEntityManager.save(newChannel);
      await transactionalEntityManager.save(userChannelMember);
      await transactionalEntityManager.save(contactChannelMember);
    });

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

  /* #endregion */

  /* #region Channel Message */
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
  private async getLatestMessageByChannelMemberId(id: number): Promise<number> {
    const latestChannelMessage = await getRepository(ChannelMessage)
      .createQueryBuilder('ChannelMessage')
      .select('MAX(ChannelMessage.nonce)', 'maxnonce')
      .where('"ChannelMessage"."channelMemberId" = :id', { id })
      .groupBy('"ChannelMessage"."channelMemberId"')
      .getRawOne();

    return latestChannelMessage.maxnonce;
  }

  /**
   * Creates a channel message
   * @param channelMessage message to create
   * @returns ChannelMessage created entity
   */
  async createChannelMessage(channelMessage: CreateChannelMessageDto): Promise<SentMessageDto> {
    // Get highest nonce for this channel message
    // TODO: lock the table in a transaction, or make sure channel member id & nonce has unique constraint, or both!
    const currentNonce = await this.getLatestMessageByChannelMemberId(channelMessage.channelMemberId);
    const nextNonce = currentNonce + 1;
    Logger.debug('got nonce: ', currentNonce.toString());

    if (channelMessage.userId) {
      Logger.debug('sending a message');

      // get the user - fail if they don't exist
      const messageSender = this.userService.findById(channelMessage.userId, true);

      // get the channel member
      const updatedChannelMember = await this.findChannelMemberById(channelMessage.channelMemberId);

      // the message is coming from the user, so it's an outgoing message
      const newChannelMessage = new ChannelMessage();
      newChannelMessage.channelMember = updatedChannelMember;
      newChannelMessage.messageContents = channelMessage.messageContents;
      newChannelMessage.nonce = nextNonce;

      // 2. Get the message key
      const newMessageKey = this.cryptoService.generateSHA256Hash(
        updatedChannelMember.messageChainKey + this.MESSAGE_KEY_RATCHET,
      );
      const newEncryptedMessage = this.cryptoService.encrypt(
        newChannelMessage.messageContents,
        nextNonce,
        newMessageKey,
      );

      // 3. Get the Channel Identifier for the message
      // - Hash(user public signing key + channelkey + message nonce)
      const userPublicSigningKey = (await messageSender).publicSigningKey;
      const channelKey = updatedChannelMember.channel.channelKey;
      const newChannelIdentifier = this.cryptoService.generateSHA256Hash(userPublicSigningKey + channelKey + nextNonce);

      // 4. update the message chain key
      updatedChannelMember.messageChainKey = this.cryptoService.generateSHA256Hash(
        updatedChannelMember.messageChainKey + this.CHAIN_KEY_RATCHET,
      );

      // 5. Send the encrypted message to IPFS - get back the IPFS hash
      const ipfsMessage = new IpfsMessageDto();
      ipfsMessage.from = (await messageSender).name;
      ipfsMessage.to = updatedChannelMember.channel.name;
      // ipfsMessage.content = newChannelMessage.messageContents;
      ipfsMessage.content = newEncryptedMessage;

      Logger.debug('saving to IPFS');
      const messageLink = await this.ipfsService.store(ipfsMessage);
      Logger.debug('IPFS Link', messageLink);

      // encrypt the IPFS hash with the message key
      const encryptedMessageLink = this.cryptoService.encrypt(messageLink, nextNonce, newMessageKey);

      // sign the encrypted IPFS hash with the user signing key
      const encryptedMessageLinkSignature = this.cryptoService.generateSignature(
        encryptedMessageLink,
        (await messageSender).privateSigningKey,
      );

      const txHash: string = await this.web3Service.emitEvent(
        newChannelIdentifier,
        encryptedMessageLink,
        encryptedMessageLinkSignature,
      );

      if (txHash) {
        await getManager().transaction(async transactionalEntityManager => {
          await transactionalEntityManager.save(newChannelMessage);
          await transactionalEntityManager.save(updatedChannelMember);
        });
        Logger.debug('txhash: ', txHash);

        const sentMessage = new SentMessageDto();
        sentMessage.channelIdentifier = newChannelIdentifier;
        sentMessage.encryptedMessageLink = encryptedMessageLink;
        sentMessage.encryptedMessageLinkSignature = encryptedMessageLinkSignature;

        return sentMessage;
      } else {
        Logger.debug('transaction failed!');
        throwError('blockchain fail!');
      }

      return null;
    }

    // 3.

    // get the message key from the message chain key
    // update the message chain key

    // when writing a message to the outside world
    // we write the message, send it to createChannelMessage
    //  return
    //  - channel identifier for the message
    //  - encrypted message
    //  - encrypted message hash (potentially used for attestation proof, rather than IPFS/SAS Token identifier)
    //  - messagekey (needed to encrypt the Document Identifier Link

    // write channel message from channelmember
    // - get message key
    // - decrypt message
    // - write message to db
    // - update message chain key
    // - return decrypted message
  }

  /* #endregion */

  /* #region Test Methods - TO BE REMOVED */
  /**
   * test method to populate the database with sample data
   * @returns Channel channel created
   */
  async testCreateUserAndContact(): Promise<void> {
    const newUser = new User();
    const oneUseKeyPair: CryptographyKeyPairDto = await this.cryptoService.generateSigningKeyPair();
    newUser.name = await (await this.cryptoService.generateRandomBytes()).toString(this.BASE_64);
    newUser.privateSigningKey = oneUseKeyPair.privateKey;
    newUser.publicSigningKey = oneUseKeyPair.publicKey;
    await this.userRepository.save(newUser);

    const newContact = new Contact();
    newContact.name = this.cryptoService.generateRandomBytes().toString(this.BASE_64);

    const handshakeKeyPair: CryptographyKeyPairDto = this.cryptoService.generateOneUseKeyPair();

    newContact.handshakePrivateKey = handshakeKeyPair.privateKey;
    newContact.handshakePublicKey = handshakeKeyPair.publicKey;

    const contactSigningKey = this.cryptoService.generateSigningKeyPair();
    const contactOneUseKey = this.cryptoService.generateOneUseKeyPair();
    newContact.signingKey = contactSigningKey.publicKey;
    newContact.oneuseKey = contactOneUseKey.publicKey;
    newContact.signature = this.cryptoService.generateSignature(
      contactOneUseKey.publicKey,
      contactSigningKey.privateKey,
    );
    newContact.user = newUser;
    await this.contactRepository.save(newContact);

    /*
    const newChannel = new Channel();
    newChannel.name = await (await this.cryptoService.generateRandomBytes()).toString(this.BASE_64);
    newChannel.channelKey = await (await this.cryptoService.generateRandomBytes()).toString(this.BASE_64);
    await this.channelRepository.save(newChannel);

    const newChannelMember = new ChannelMember();
    newChannelMember.channel = newChannel;
    newChannelMember.user = newUser;
    newChannelMember.messageChainKey = await (await this.cryptoService.generateRandomBytes()).toString(this.BASE_64);
    await this.channelMemberRepository.save(newChannelMember);

    const newChannelMember2 = new ChannelMember();
    newChannelMember2.channel = newChannel;
    newChannelMember2.contact = newContact;
    newChannelMember2.messageChainKey = await (await this.cryptoService.generateRandomBytes()).toString(this.BASE_64);
    await this.channelMemberRepository.save(newChannelMember2);

    await this.testCreateChannelMessage('hello', newChannelMember, 0);
    await this.testCreateChannelMessage('hello to you too', newChannelMember2, 0);
    await this.testCreateChannelMessage('how are you doing', newChannelMember, 1);
    await this.testCreateChannelMessage('where is the game?', newChannelMember, 2);
    await this.testCreateChannelMessage('stop talking', newChannelMember2, 1);

    return newChannel;
    */
  }

  /**
   * test method to populate the database with sample data
   * @param contents message contents
   * @param member channel member object writing message
   * @param nonce message nonce
   */
  private async testCreateChannelMessage(contents: string, member: ChannelMember, nonce) {
    const channelMessage = new ChannelMessage();
    channelMessage.messageContents = contents;
    channelMessage.nonce = nonce;
    channelMessage.channelMember = member;
    await this.channelMessageRepository.save(channelMessage);
  }
  /* #endregion */
}
