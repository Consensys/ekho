import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique('UQ_USER_CHANNELID', ['to', 'channelId'])
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  timestamp: Date;

  @Column()
  from: string;

  @Column()
  to: string;

  @Column()
  content: string;

  @Column()
  ipfsPath: string;

  @Column()
  txHash: string;

  @Column()
  channelId: string;
}
