import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptographyService } from '../cryptography/cryptography.service';
import CreateUserDto from './dto/create-user.dto';
import UserDto from './dto/user.dto';
import { User } from './entities/users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cryptographyService: CryptographyService,
  ) {}

  async create(user: CreateUserDto): Promise<UserDto> {
    const newUser = new User();
    newUser.name = user.name;
    const keyPair = await this.cryptographyService.generateSigningKeyPair();
    newUser.privateSigningKey = keyPair.privateKey;
    newUser.publicSigningKey = keyPair.publicKey;
    const dbUser = await this.userRepository.save(newUser);
    return {
      id: dbUser.id,
      name: dbUser.name,
    };
  }

  async findByName(name: string): Promise<UserDto> {
    return this.userRepository.findOne({
      select: ['name'],
      where: { name },
    });
  }

  async find(name: string): Promise<User> {
    return this.userRepository.findOne({ where: { name } });
  }

  async findById(id: number, orFail = false): Promise<User> {
    if (orFail) {
      return this.userRepository.findOne(id);
    } else {
      return this.userRepository.findOneOrFail(id);
    }
  }

  async delete(name: string): Promise<void> {
    await this.userRepository.delete({ name });
  }
}
