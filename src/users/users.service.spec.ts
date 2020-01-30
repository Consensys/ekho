import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mockRepository } from '../../test/test-helpers';
import { CryptographyService } from '../cryptography/cryptography.service';
import CreateUserDto from './dto/create-user.dto';
import { User } from './entities/users.entity';
import { fakeUser } from './test-helpers/faker';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const anonName = 'anon';
  const anonUserDto: CreateUserDto = { name: anonName };
  const anonUser = fakeUser({ name: anonName });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, CryptographyService, { provide: getRepositoryToken(User), useClass: mockRepository }],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('calls user repository to save a user', async () => {
    jest.spyOn(repository, 'save').mockResolvedValueOnce(anonUser);

    const actual = await service.create(anonUserDto);

    expect(repository.save).toBeCalledTimes(1);
    expect(actual).toEqual({ id: -1, name: anonName });
  });

  it('calls user repository to find a user', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValueOnce(anonUser);

    const actual = await service.find(anonName);

    expect(repository.findOne).lastCalledWith({ where: { name: anonName } });
    expect(actual).toEqual(anonUser);
  });

  it('calls user repository to find a user by name', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValueOnce(anonUser);

    const actual = await service.findByName(anonName);

    expect(repository.findOne).lastCalledWith({ select: ['name'], where: { name: anonName } });
    expect(actual).toEqual(anonUser);
  });

  it('calls user repository to delete a user by name', async () => {
    await service.delete(anonName);

    expect(repository.delete).lastCalledWith({ name: anonName });
  });
});
