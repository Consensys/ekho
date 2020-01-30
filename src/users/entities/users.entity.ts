import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ChannelMember } from '../../channels/entities/channelmembers.entity';
import { Contact } from '../../contacts/contacts.entity';

@Entity()
@Unique('UQ_NAME', ['name'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  name: string;

  @Column()
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
}
