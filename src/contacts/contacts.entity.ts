import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ChannelMember } from '../messages/entities/channelmembers.entity';

@Entity()
@Unique('UQ_CONTACT_NAME', ['name'])
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  name: string;

  @Column({ type: 'bytea' })
  identifier: Buffer;

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
}
