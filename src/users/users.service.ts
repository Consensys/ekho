import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptographyService } from '../cryptography/cryptography.service';
import { VaultService } from '../vault/vault.service';
import CreateUserDto from './dto/create-user.dto';
import UserDto from './dto/user.dto';
import { User } from './entities/users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cryptographyService: CryptographyService,
    private readonly vaultService: VaultService,
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
      await this.vaultService.userWritePrivateKey(dbUser.id, keyPair.privateKey);
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

  async findByName(name: string): Promise<User> {
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
    const privateKey = await this.vaultService.userReadPrivateKey(user.id);
    user.privateSigningKey = privateKey;
    return user;
  }
}
