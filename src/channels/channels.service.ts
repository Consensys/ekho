import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactsService } from 'src/contacts/contacts.service';
import { CryptographyService } from 'src/cryptography/cryptography.service';
import { UsersService } from 'src/users/users.service';
import { FindOneOptions, Repository } from 'typeorm';
import CreateChannelDto from './dto/create-channel.dto';
import CreateChannelMemberDto from './dto/create-channelmember.dto';
import { ChannelMember } from './entities/channelmembers.entity';
import { Channel } from './entities/channels.entity';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private readonly channelMemberRepository: Repository<ChannelMember>,
    private readonly cryptoService: CryptographyService,
    private readonly userService: UsersService,
    private readonly contactService: ContactsService,
  ) {}

  async createChannelMember(channelMember: CreateChannelMemberDto): Promise<ChannelMember> {
    const newChannelMember = new ChannelMember();

    // validate user (might not be present)
    if (channelMember.userId !== 0) {
      const channelUser = await this.userService.findById(channelMember.userId);
      newChannelMember.user = channelUser;
    } else {
      newChannelMember.user = null;
    }

    // validate contact (might not be present)
    if (channelMember.contactId !== 0) {
      const channelContact = await this.contactService.findOneById(channelMember.contactId);
      newChannelMember.contact = channelContact;
      newChannelMember.contact.id = channelMember.contactId;
    } else {
      newChannelMember.contact = null;
    }

    newChannelMember.channel = await this.findChannelById(channelMember.channelId);
    newChannelMember.messageChainKey = channelMember.messageChainKey;
    newChannelMember.nonce = channelMember.nonce;

    await this.channelMemberRepository.save(newChannelMember);
    return newChannelMember;
  }

  async deleteChannelMember(id: number): Promise<void> {
    await this.channelMemberRepository.delete({ id });
  }

  async findOneChannelMember(findClause: FindOneOptions<ChannelMember>): Promise<ChannelMember> {
    return this.channelMemberRepository.findOneOrFail(findClause);
  }

  async findChannelMemberByContactId(id: number): Promise<ChannelMember> {
    return this.findOneChannelMember({
      where: { contactId: id },
    });
  }

  async findChannelMemberByUserId(id: number): Promise<ChannelMember> {
    return this.findOneChannelMember({
      where: { userid: id },
    });
  }

  async getAllChannelMembersByChannelId(id: number): Promise<ChannelMember[]> {
    return this.channelMemberRepository.find({
      where: { channelId: id },
    });
  }

  async getAllChannelMembers(id: number): Promise<ChannelMember[]> {
    return this.channelMemberRepository.find({});
  }

  async createChannel(channel: CreateChannelDto): Promise<number> {
    const newChannel = new Channel();
    newChannel.name = channel.name;
    newChannel.channelKey = channel.channelKey;

    await this.channelRepository.save(newChannel);
    return newChannel.id;
  }

  async deleteChannel(id: number): Promise<void> {
    await this.channelRepository.delete({ id });
  }

  async findOneChannel(findClause: FindOneOptions<Channel>): Promise<Channel> {
    return this.channelRepository.findOneOrFail(findClause);
  }

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

  async testChannel(): Promise<Channel> {
    const newChannel = new Channel();
    newChannel.name = 'Test Channel';
    newChannel.channelKey = await this.cryptoService.generateRandomBytes();

    await this.channelRepository.save(newChannel);
    return newChannel;
  }
}
