import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from 'src/contacts/contacts.entity';
import { ContactsService } from 'src/contacts/contacts.service';
import { CryptographyService } from 'src/cryptography/cryptography.service';
import { User } from 'src/users/entities/users.entity';
import { UsersService } from 'src/users/users.service';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import ChannelMemberDto from './dto/channelmember.dto';
import CreateChannelDto from './dto/create-channel.dto';
import CreateChannelMemberDto from './dto/create-channelmember.dto';
import CreateChannelMessageDto from './dto/create-channelmessage.dto';
import { ChannelMember } from './entities/channelmembers.entity';
import { ChannelMessage } from './entities/channelmessages.entity';
import { Channel } from './entities/channels.entity';

@Injectable()
export class ChannelsService {
  private readonly BASE_64 = 'base64';

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
    private readonly cryptoService: CryptographyService,
    private readonly userService: UsersService,
    private readonly contactService: ContactsService,
  ) {}

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

  /**
   * Creates a channel
   * @param channel channel to be created
   * @returns Channel - created channel entity
   */
  async createChannel(channel: CreateChannelDto): Promise<Channel> {
    const newChannel = new Channel();
    newChannel.name = channel.name;
    newChannel.channelKey = channel.channelKey;

    await this.channelRepository.save(newChannel);
    return newChannel;
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
   * Creates a channel message
   * @param channelMessage message to create
   * @returns ChannelMessage created entity
   */
  async createChannelMessage(channelMessage: CreateChannelMessageDto): Promise<ChannelMessage> {
    const newChannelMessage = new ChannelMessage();
    newChannelMessage.channelMember = await this.findChannelMemberById(channelMessage.channelMemberId);
    newChannelMessage.messageContents = channelMessage.messageContents;
    newChannelMessage.nonce = channelMessage.nonce; // TODO: some check to ensure this nonce doesn't already exist for that channelmember
    return this.channelMessageRepository.save(newChannelMessage);
  }

  /**
   * test method to populate the database with sample data
   * @returns Channel channel created
   */
  async testChannelMessages(): Promise<Channel> {
    const newUser = new User();
    newUser.name = 'eoin';
    newUser.privateSigningKey = await (await this.cryptoService.generateRandomBytes()).toString(this.BASE_64);
    newUser.publicSigningKey = await (await this.cryptoService.generateRandomBytes()).toString(this.BASE_64);
    await this.userRepository.save(newUser);

    const newContact = new Contact();
    newContact.name = 'Joao';
    newContact.handshakePrivateKey = await (await this.cryptoService.generateRandomBytes()).toString(this.BASE_64);
    newContact.handshakePublicKey = await (await this.cryptoService.generateRandomBytes()).toString(this.BASE_64);
    newContact.signingKey = await (await this.cryptoService.generateRandomBytes()).toString(this.BASE_64);
    newContact.oneuseKey = await (await this.cryptoService.generateRandomBytes()).toString(this.BASE_64);
    newContact.signature = await (await this.cryptoService.generateRandomBytes()).toString(this.BASE_64);
    newContact.user = newUser;
    await this.contactRepository.save(newContact);

    const newChannel = new Channel();
    newChannel.name = 'Test Channel';
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
}
