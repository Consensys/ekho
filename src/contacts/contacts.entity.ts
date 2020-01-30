import { Column, Entity, Generated, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ChannelMember } from '../channels/entities/channelmembers.entity';
import { User } from '../users/entities/users.entity';

@Entity()
@Unique('UQ_CONTACT_USER_NAME', ['user', 'name'])
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  name: string;

  @Column()
  @Generated('uuid')
  identifier: string;

  @Column()
  handshakePrivateKey: string;

  @Column()
  handshakePublicKey: string;

  @Column({ nullable: true })
  signingKey?: string;

  @Column({ nullable: true })
  oneuseKey?: string;

  @Column({ nullable: true })
  signature?: string;

  @OneToMany(
    type => ChannelMember,
    channelmember => channelmember.contact,
  )
  channelmembers: ChannelMember[];

  @ManyToOne(
    type => User,
    user => user.contacts,
  )
  user: User;
}
