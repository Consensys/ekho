import { Injectable } from '@nestjs/common';
import CreateUserDto from './dto/create-user.dto';
import { User } from './users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import UserDto from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(user: CreateUserDto): Promise<void> {
    const newUser = new User();
    newUser.name = user.name;
    // newUser.privateKey = this.cryptographyService.generatePrivateKey()
    await this.userRepository.save(newUser);
  }

  async findByName(name: string): Promise<UserDto> {
    return this.userRepository.findOne({
      select: ['name'],
      where: { name }});
  }
}
