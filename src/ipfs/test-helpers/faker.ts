import { IpfsMessageDto } from '../dto/ipfs-message.dto';

const anonIpfsMessage: IpfsMessageDto = {
  from: 'me',
  to: 'you',
  content: 'no-such-content',
};

export const fakeIpfsMessage = (partial?: Partial<IpfsMessageDto>): IpfsMessageDto => {
  const msg = partial ? partial : {};
  return { ...anonIpfsMessage, ...msg };
};
