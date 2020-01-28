import { ChannelMember } from 'src/channels/entities/channelmembers.entity';
import { Column, Entity, Generated, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
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

  @Column({ type: 'bytea' })
  handshakePrivateKey: Buffer;

  @Column({ type: 'bytea' })
  handshakePublicKey: Buffer;

  @Column({ type: 'bytea', nullable: true })
  signingKey?: Buffer;

  @Column({ type: 'bytea', nullable: true })
  oneuseKey?: Buffer;

  @Column({ type: 'bytea', nullable: true })
  signature?: Buffer;

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
