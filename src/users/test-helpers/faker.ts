import { fakerFactory } from '../../../test/test-helpers';
import { User } from '../entities/users.entity';

const anonUser: User = {
  id: -1,
  name: 'anon-user',
  channelmembers: [],
  contacts: [],
  broadcastchannels: [],
};

export const fakeUser = fakerFactory<User>(anonUser);
