import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mockQueryRunner, mockRepository } from '../../test/test-helpers';
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
  const vaultServiceMock = {
    userWritePrivateKey: jest.fn(),
    userReadPrivateKey: jest.fn().mockReturnValue('this-is-private-key'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        CryptographyService,
        {
          provide: 'KeyManager',
          useValue: vaultServiceMock,
        },
        { provide: getRepositoryToken(User), useClass: mockRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('userRepository should be defined', async () => {
    expect(repository).toBeDefined();
    expect(repository.findOne).toBeDefined();
    expect(repository.findOneOrFail).toBeDefined();
  });

  it('calls user repository to save a user', async () => {
    mockQueryRunner.manager.save.mockReturnValue(anonUser);
    const actual = await service.create(anonUserDto);

    // make sure regular save call are not used in a transaction context
    expect(repository.save).toBeCalledTimes(0);
    // assert save via transactions
    expect(mockQueryRunner.manager.save).toBeCalledTimes(1);
    expect(mockQueryRunner.startTransaction).toBeCalledTimes(1);
    expect(mockQueryRunner.commitTransaction).toBeCalledTimes(1);
    expect(mockQueryRunner.rollbackTransaction).toBeCalledTimes(0);
    expect(mockQueryRunner.release).toBeCalledTimes(1);
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

    expect(repository.findOne).toBeCalledTimes(1);
    expect(repository.findOne).lastCalledWith({ select: ['name'], where: { name: anonName } });
    expect(actual).toEqual(anonUser);
  });

  it('calls user repository to delete a user by name', async () => {
    jest.spyOn(repository, 'delete').mockResolvedValueOnce(undefined);

    await service.delete(anonName);

    expect(repository.delete).toBeCalledTimes(1);
    expect(repository.delete).lastCalledWith({ name: anonName });
  });

  it('findById delegates userRepository to find a user by a given id', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValueOnce(anonUser);

    const actual = await service.findById(anonUser.id);

    expect(repository.findOne).toBeCalledTimes(1);
    expect(repository.findOne).lastCalledWith(anonUser.id);
    expect(actual).toBe(anonUser);
  });

  it('findById has an optional boolean `orFail` param, using which means delegating findOrFail rather than findOne', async () => {
    jest.spyOn(repository, 'findOneOrFail').mockResolvedValueOnce(anonUser);

    const actual = await service.findById(anonUser.id, true);

    expect(repository.findOneOrFail).toBeCalledTimes(1);
    expect(repository.findOneOrFail).lastCalledWith(anonUser.id);
    expect(actual).toBe(anonUser);
  });

  it('findAll just barfs back all the users', async () => {
    const expected = [anonUser];
    jest.spyOn(repository, 'find').mockResolvedValueOnce(expected);

    const actual = await service.findAll();

    expect(repository.find).toBeCalledTimes(1);
    expect(repository.find).lastCalledWith();
    expect(actual).toBe(expected);
  });
});
