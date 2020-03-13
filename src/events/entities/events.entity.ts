import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
