import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { Channel } from './channels.entity';

@Entity()
export class BroadcastChannel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  broadcastKey: string;

  @ManyToOne(
    type => User,
    user => user.broadcastchannels,
  )
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToOne(type => Channel)
  @JoinColumn()
  channel: Channel;
}
