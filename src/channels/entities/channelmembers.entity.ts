import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Contact } from '../../contacts/contacts.entity';
import { User } from '../../users/entities/users.entity';
import { ChannelMessage } from './channelmessages.entity';
import { Channel } from './channels.entity';

@Entity()
export class ChannelMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    type => Channel,
    channel => channel.channelmembers,
  )
  @JoinColumn({ name: 'channelId' })
  channel: Channel;

  @ManyToOne(
    type => User,
    user => user.channelmembers,
  )
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(
    type => Contact,
    contact => contact.channelmembers,
  )
  @JoinColumn({ name: 'contactId' })
  contact: Contact;

  @OneToMany(
    type => ChannelMessage,
    channelmessage => channelmessage.channelMember,
  )
  channelmessages: ChannelMessage[];

  @Column()
  messageChainKey: string;
}
