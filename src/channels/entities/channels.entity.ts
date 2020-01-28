import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ChannelMember } from './channelmembers.entity';

@Entity()
@Unique('UQ_CHANNELKEY', ['channelKey'])
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
