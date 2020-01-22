import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CryptographyService } from 'src/cryptography/cryptography.service';
import { Repository } from 'typeorm';
import ChannelDto from './dto/channel.dto';
import CreateChannelDto from './dto/create-channel.dto';
import CreateChannelMemberDto from './dto/create-channelmember.dto';
import { Channel } from './entities/channels.entity';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    private readonly cryptoService: CryptographyService,
  ) {}

  async add(channelMember: CreateChannelMemberDto) {
    // const newChannelMember = new ChannelMember();
    // validate user from dto
    // validate contact from dto
  }

  async createChannel(channel: CreateChannelDto): Promise<number> {
    const newChannel = new Channel();
    newChannel.name = channel.name;
    newChannel.channelKey = channel.channelKey;

    await this.channelRepository.save(newChannel);
    return newChannel.id;
  }

  async findChannelByName(name: string): Promise<ChannelDto> {
    return this.channelRepository.findOneOrFail({
      where: { name },
    });
  }

  async findChannelById(id: number): Promise<ChannelDto> {
    return this.channelRepository.findOneOrFail({
      where: { id },
    });
  }

  async ChannelTest(): Promise<ChannelDto> {
    const newChannel = new Channel();
    newChannel.name = 'Test Channel';
    newChannel.channelKey = await this.cryptoService.generateRandomBytes();

    await this.channelRepository.save(newChannel);
    return newChannel;
  }
}
