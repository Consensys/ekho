import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { BroadcastChannel } from '../../channels/entities/broadcastchannels.entity';
import { ChannelMember } from '../../channels/entities/channelmembers.entity';
import { Contact } from '../../contacts/contacts.entity';

@Entity()
@Unique('UQ_NAME', ['name'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  name: string;

  // TODO remove private signing key when channels are merged
  //      removing now will cause lots of conflicts on on-going work
  @Column({ nullable: true })
  privateSigningKey?: string;

  @Column()
  publicSigningKey?: string;

  @OneToMany(
    type => ChannelMember,
    channelmember => channelmember.user,
  )
  channelmembers: ChannelMember[];

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
