import { ChannelMember } from 'src/channels/entities/channelmembers.entity';
import { Column, Entity, Generated, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique('UQ_NAME', ['name'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Generated('uuid')
  uuid: string;

  @Column({ length: 500 })
  name: string;

  @Column({ type: 'bytea' })
  privateSigningKey?: Buffer;

  @Column({ type: 'bytea' })
  publicSigningKey?: Buffer;

  @OneToMany(
    type => ChannelMember,
    channelmember => channelmember.user,
  )
  channelmembers: ChannelMember[];
}
