import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChannelMessage } from '../../channels/entities/channelmessages.entity';

@Entity()
export class EkhoEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  txHash: string;

  @Column()
  status: string;

  @Column({ nullable: true })
  channelId?: string;

  @Column({ nullable: true })
  content?: string;

  @Column({ nullable: true })
  signature?: string;

  @CreateDateColumn()
  createdDate: Date;

  @Column({ nullable: true })
  block: number;

  @Column({ nullable: false })
  processed: boolean;

  @OneToMany(
    type => ChannelMessage,
    channelmessage => channelmessage.ekhoEvent,
  )
  channelmessages: ChannelMessage[];
}
