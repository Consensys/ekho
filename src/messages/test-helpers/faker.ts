import { ChannelMessage } from 'src/channels/entities/channelmessages.entity';
import { fakerFactory } from '../../../test/test-helpers';
import { ChannelMember } from '../../channels/entities/channelmembers.entity';
import { Channel } from '../../channels/entities/channels.entity';
import { fakeContact } from '../../contacts/test-helpers/faker';
import { fakeUser } from '../../users/test-helpers/faker';
import SendMessageDto from '../dto/send-message.dto';
import { Message } from '../entities/messages.entity';
/* tslint:disable prefer-const no-var no-var-keyword */
/*
  We need to disable prefer-const here to stop lint bitching about 'declared before use.
  Then we need to disable no-var here to prevent lint 'fixing' the var declaration by changing it to let. Then bitching about declare-before-use.
  Fuck linters.
*/
var anonMessage: Message = {
  id: -1,
  from: 'me',
  to: 'you',
  content: 'balls. lol.',
  timestamp: new Date(0),
  ipfsPath: 'no-such-path',
  txHash: '0xffffff7f',
  channelId: 'no-such-channel',
};

var anonChannelMember: ChannelMember = {
  id: -1,
  user: fakeUser(),
  messageChainKey: 'anon-chain-key',
  channel: anonChannel,
  contact: fakeContact(),
  channelmessages: [anonChannelMessage],
  nextChannelIdentifier: 'xxx',
};

var anonChannelMessage: ChannelMessage = {
  id: -1,
  channelMember: anonChannelMember,
  messageContents: 'anon-message-contents',
  nonce: 0,
};

var anonChannel: Channel = {
  id: -1,
  name: 'anon-channel-name',
  channelKey: 'no-such-key',
  channelmembers: [anonChannelMember],
};

const anonSendMessageDto: SendMessageDto = {
  from: 'me',
  to: 'you',
  content: 'anon-message-content',
  channelId: 'no-such-channel',
};

export const fakeChannel = fakerFactory<Channel>(anonChannel);

export const fakeChannelMember = fakerFactory<ChannelMember>(anonChannelMember);

export const fakeChannelMessage = fakerFactory<ChannelMessage>(anonChannelMessage);

export const fakeMessage = fakerFactory<Message>(anonMessage);

export const fakeSendMessageDto = fakerFactory<SendMessageDto>(anonSendMessageDto);
