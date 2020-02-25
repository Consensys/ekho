import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptographyService } from '../cryptography/cryptography.service';
import { KeyManager } from '../key-manager/key-manager.interface';
import CreateUserDto from './dto/create-user.dto';
import UserDto from './dto/user.dto';
import { User } from './entities/users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cryptographyService: CryptographyService,
    @Inject('KeyManager')
    private readonly keyManagerService: KeyManager,
  ) {}

  async create(user: CreateUserDto): Promise<UserDto> {
    const newUser = new User();
    newUser.name = user.name;
    const keyPair = this.cryptographyService.generateSigningKeyPair();
    newUser.publicSigningKey = keyPair.publicKey;

    const queryRunner = this.userRepository.manager.connection.createQueryRunner();
    queryRunner.startTransaction();
    try {
      const dbUser = await queryRunner.manager.save(newUser);
      await this.keyManagerService.createSigningKey(dbUser.id);
      await queryRunner.commitTransaction();
      return {
        id: dbUser.id,
        name: dbUser.name,
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      queryRunner.release();
    }
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async getPublicKey(id: number): Promise<string> {
    return this.keyManagerService.readPublicSigningKey(id);
  }

  async sign(id: number, data: string): Promise<string> {
    return this.keyManagerService.sign(id, data);
  }

  async findByName(name: string): Promise<UserDto> {
    return this.userRepository.findOne({
      select: ['name'],
      where: { name },
    });
  }

  async find(name: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { name } });
    return this.populatePrivateKey(user);
  }

  async findById(id: number, orFail = false): Promise<User> {
    if (orFail) {
      const user = await this.userRepository.findOneOrFail(id);
      return this.populatePrivateKey(user);
    } else {
      const user = await this.userRepository.findOne(id);
      return this.populatePrivateKey(user);
    }
  }

  async delete(name: string): Promise<void> {
    await this.userRepository.delete({ name });
  }

  private async populatePrivateKey(user: User): Promise<User> {
    const publicSigningKey = await this.keyManagerService.readPublicSigningKey(user.id);
    user.publicSigningKey = publicSigningKey;
    return user;
  }
}
