import { fakerFactory } from '../../../test/test-helpers';
import { Contact } from '../contacts.entity';

const anonContact: Contact = {
  id: -1,
  name: 'anon-name',
  identifier: Buffer.from('anon-identifier'),
  handshakePublicKey: Buffer.from('anon-handshake-public-key'),
  handshakePrivateKey: Buffer.from('anon-handshake-private-key'),
  channelmembers: [],
};

export const fakeContact = fakerFactory<Contact>(anonContact);
