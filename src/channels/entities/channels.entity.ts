import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChannelMember } from './channelmembers.entity';

@Entity()
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  channelKey: string;

  @OneToMany(
    type => ChannelMember,
    channelmember => channelmember.channel,
  )
  channelmembers: ChannelMember[];
}
