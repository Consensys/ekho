import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mockRepository } from '../../test/test-helpers';
import { CryptographyService } from '../cryptography/cryptography.service';
import CreateUserDto from './dto/create-user.dto';
import { User } from './entities/users.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('Users Controller', () => {
  let controller: UsersController;
  let service: UsersService;

  const anonName = 'Farts McGubbins';
  const anonUser: User = new User();
  anonUser.id = 1;
  anonUser.name = anonName;
  const anonUserDto: CreateUserDto = { name: anonName };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: getRepositoryToken(User), useClass: mockRepository }, CryptographyService, UsersService],
      controllers: [UsersController],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('calls UsersService.create to create a user', async () => {
    jest.spyOn(service, 'create').mockResolvedValueOnce(anonUser);

    const actual = await controller.create(anonUserDto);

    expect(service.create).toBeCalledTimes(1);
    expect(service.create).lastCalledWith(anonUserDto);
    expect(actual).toBe(anonUser);
  });

  it('calls UsersService.findByName to find a user', async () => {
    jest.spyOn(service, 'findByName').mockResolvedValueOnce(anonUser);

    const actual = await controller.get(anonName);

    expect(service.findByName).toBeCalledTimes(1);
    expect(service.findByName).lastCalledWith(anonName);
    expect(actual).toBe(anonUser);
  });
});
