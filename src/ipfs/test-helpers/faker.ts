import { fakerFactory } from '../../../test/test-helpers';
import { IpfsMessageDto } from '../dto/ipfs-message.dto';

const anonIpfsMessage: IpfsMessageDto = {
  from: 'me',
  to: 'you',
  content: 'no-such-content',
};

export const fakeIpfsMessage = fakerFactory(anonIpfsMessage);
