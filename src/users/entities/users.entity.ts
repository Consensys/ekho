import { ChannelMember } from 'src/channels/entities/channelmembers.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique('UQ_NAME', ['name'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  name: string;

  @Column({ type: 'bytea' })
  privateSigningKey?: Buffer;

  @Column({ type: 'bytea' })
  publicSigningKey?: Buffer;

  @OneToMany(
    type => ChannelMember,
    channelmembers => channelmembers.user,
  )
  channelmembers: ChannelMember[];
}
