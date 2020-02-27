import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { BroadcastChannel } from '../../channels/entities/broadcastchannels.entity';
import { ChannelMember } from '../../channels/entities/channelmembers.entity';
import { Contact } from '../../contacts/contacts.entity';

@Entity()
@ObjectType()
@Unique('UQ_NAME', ['name'])
export class User {
  @Field(type => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ length: 500 })
  name: string;

  @Field(type => [ChannelMember], { nullable: true })
  @OneToMany(
    type => ChannelMember,
    channelmember => channelmember.user,
  )
  channelmembers: ChannelMember[];

  @Field(type => [Contact], { nullable: true })
  @OneToMany(
    type => Contact,
    contact => contact.user,
  )
  contacts: Contact[];

  @OneToMany(
    type => BroadcastChannel,
    broadcastchannel => broadcastchannel.user,
  )
  broadcastchannels: BroadcastChannel[];
}
