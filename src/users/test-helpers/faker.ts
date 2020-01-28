import { fakerFactory } from '../../../test/test-helpers';
import { User } from '../entities/users.entity';

const anonUser: User = {
  id: -1,
  uuid: 'anon-uuid',
  name: 'anon-user',
  channelmembers: [],
};

export const fakeUser = fakerFactory<User>(anonUser);
