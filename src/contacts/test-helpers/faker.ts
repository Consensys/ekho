import { fakerFactory } from '../../../test/test-helpers';
import { fakeUser } from '../../users/test-helpers/faker';
import { Contact } from '../contacts.entity';
import ContactHandshakeDto from '../dto/contact-handshake.dto';

const anonContact: Contact = {
  id: -1,
  name: 'anon-name',
  identifier: 'anon-identifier',
  user: fakeUser(),
  handshakePublicKey: 'anon-handshake-public-key',
  handshakePrivateKey: 'anon-handshake-private-key',
  channelmembers: [],
};

const anonContactHandshakeDto: ContactHandshakeDto = {
  from: '',
  to: '',
  identifier: 'no-such-identifier',
  oneuseKey: 'ffffff7f',
  signingKey: 'fafafafa',
  signature: 'i-signed-this',
};

export const fakeContact = fakerFactory<Contact>(anonContact);

export const fakeContactHandshake = fakerFactory<ContactHandshakeDto>(anonContactHandshakeDto);
