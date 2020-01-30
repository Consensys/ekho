import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from 'src/contacts/contacts.entity';
import { ContactsService } from 'src/contacts/contacts.service';
import { CryptographyService } from 'src/cryptography/cryptography.service';
import { User } from 'src/users/entities/users.entity';
import { UsersService } from 'src/users/users.service';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import CreateChannelDto from './dto/create-channel.dto';
import CreateChannelMemberDto from './dto/create-channelmember.dto';
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

  async findAllChannelMessagesByChannelId(id: number): Promise<ChannelMember[]> {
    return this.channelMemberRepository.find({
      where: [{ channel: id }],
      relations: ['channelmessages', 'channel', 'user', 'contact'],
    });
    /*
    channel.channelmembers = await this.channelMemberRepository
      .createQueryBuilder()
      .relation(Channel, "channelmembers")
      .of(channel)
      .loadMany();
    */

    /*
    return this.channelMemberRepository
    .createQueryBuilder("channelMember")

    .select("channelmessage.id", "message.Id")

    .addSelect("channelmessage.messageContents", "message.contents")
    .addSelect("channelmessage.nonce", "message.nonce")

    .addSelect("contact.signingKey", "message.contactPublicSigningKey")
    .addSelect("contact.name", "message.contactName")
    .addSelect("contact.id", "message.contactId")

    .addSelect("user.publicSigningKey", "message.userPublicSigningKey")
    .addSelect("user.name", "messsage.userName")
    .addSelect("user.id", "message.userid")

    .addSelect("channel.channelKey", "message.channelKey")
    .addSelect("channel.name", "message.channelName")
    .addSelect("channel.id", "message.channelId")

    .addSelect("channelMember.messageChainKey", "message.messageChainKey")
    .addSelect("channelMember.id", "message.channelMemberId")

    .leftJoin("channelMember.channelmessages", "channelmessage")
    .leftJoin("channelMember.channel", "channel")
    .leftJoin("channelMember.contact", "contact")
    .leftJoin("channelMember.user", "user")
    .where({ channelId: id })
    .execute();
    */
  }

  /**
   * Creates a channel
   * @param channel channel object
   */
  async createChannel(channel: CreateChannelDto): Promise<number> {
    const newChannel = new Channel();
    newChannel.name = channel.name;
    newChannel.channelKey = channel.channelKey;

    await this.channelRepository.save(newChannel);
    return newChannel.id;
  }

  /**
   * Deletes a channel
   * @param id channel id
   */
  async deleteChannel(id: number): Promise<void> {
    await this.channelRepository.delete({ id });
  }

  /**
   * Finds one channel
   * @param findClause JSON find clause to return one channel record
   */
  async findOneChannel(findClause: FindOneOptions<Channel>): Promise<Channel> {
    return this.channelRepository.findOneOrFail(findClause);
  }

  /**
   *
   * @param name
   */
  async findChannelByName(name: string): Promise<Channel> {
    return this.channelRepository.findOne({
      where: { name },
    });
  }

  async findChannelById(id: number): Promise<Channel> {
    return this.channelRepository.findOne({
      where: { id },
    });
  }

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

  private async testCreateChannelMessage(contents: string, member: ChannelMember, nonce) {
    const channelMessage = new ChannelMessage();
    channelMessage.messageContents = contents;
    channelMessage.nonce = nonce;
    channelMessage.channelMember = member;
    await this.channelMessageRepository.save(channelMessage);
  }
}
