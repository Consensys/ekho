import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Contact } from '../../contacts/contacts.entity';
import { User } from '../../users/entities/users.entity';
import { ChannelMessage } from './channelmessages.entity';
import { Channel } from './channels.entity';
@Entity()
@ObjectType()
export class ChannelMember {
  @Field(type => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(type => Channel)
  @ManyToOne(
    type => Channel,
    channel => channel.channelmembers,
  )
  @JoinColumn({ name: 'channelId' })
  channel: Channel;

  @Field(type => User)
  @ManyToOne(
    type => User,
    user => user.channelmembers,
  )
  @JoinColumn({ name: 'userId' })
  user: User;

  @Field(type => Contact)
  @ManyToOne(
    type => Contact,
    contact => contact.channelmembers,
  )
  @JoinColumn({ name: 'contactId' })
  contact: Contact;

  // @Field(type => [ChannelMessage])
  @OneToMany(
    type => ChannelMessage,
    channelmessage => channelmessage.channelMember,
  )
  channelmessages: ChannelMessage[];

  @Field()
  @Column()
  messageChainKey: string;

  @Field()
  @Column()
  nextChannelIdentifier: string;
}
