import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChannelMember } from '../../channels/entities/channelmembers.entity';

@Entity()
export class ChannelMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    type => ChannelMember,
    channelMember => channelMember.channelmessages,
  )
  channelMember: ChannelMember;

  @Column()
  messageContents: string;
}
