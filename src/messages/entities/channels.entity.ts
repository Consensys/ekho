import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ChannelMember } from './channelmembers.entity';

@Entity()
@Unique('UQ_CHANNELKEY', ['channelKey'])
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bytea' })
  channelKey: Buffer;

  @OneToMany(
    type => ChannelMember,
    channelMember => channelMember.channel,
  )
  channelMember: ChannelMember;
}
