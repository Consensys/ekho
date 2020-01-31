import { UsersService } from '../users.service';

export const mockUsersService: jest.Mock<Omit<UsersService, 'usersRepository cryptographyService'>> = jest.fn(() => {
  return {
    create: jest.fn(),
    find: jest.fn(),
    findByName: jest.fn(),
    findById: jest.fn(),
    delete: jest.fn(),
  };
});
