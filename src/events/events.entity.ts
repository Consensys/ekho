import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique('UQ_TX_HASH', ['txHash'])
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
}
