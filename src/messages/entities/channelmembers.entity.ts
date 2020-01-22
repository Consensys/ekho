import { Contact } from 'src/contacts/contacts.entity';
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { ChannelMessage } from './channelmessages.entity';
import { Channel } from './channels.entity';

@Entity()
export class ChannelMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    type => Channel,
    channel => channel.channelMember,
  )
  channel: Channel;

  @ManyToOne(
    type => User,
    user => user.channelmembers,
  )
  user: User;

  @ManyToOne(
    type => Contact,
    contact => contact.channelmembers,
  )
  contact: Contact;

  @OneToMany(
    type => ChannelMessage,
    channelmessage => channelmessage.channelMember,
  )
  channelmessages: ChannelMessage[];

  @Column({ type: 'bytea' })
  messageChainKey: Buffer;

  @Column({ type: 'bytea' })
  nonce: number;
}
