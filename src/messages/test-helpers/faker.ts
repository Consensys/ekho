import { Message } from '../entities/messages.entity';

const anonMessage: Message = {
  id: -1,
  from: 'me',
  to: 'you',
  content: 'balls. lol.',
  timestamp: new Date(0),
  ipfsPath: 'no-such-path',
  txHash: '0xffffff7f',
  channelId: 'no-such-channel',
};

export const fakeMessage = (partial?: Partial<Message>): Message => {
  const msg = partial ? partial : {};
  return { ...anonMessage, ...msg };
};
