import { Entity, Column, PrimaryGeneratedColumn, Unique, CreateDateColumn } from 'typeorm';

@Entity()
@Unique('UQ_TX_HASH', ['txHash'])
export class Web3Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  txHash: string;

  @Column()
  status: string;

  @Column({ nullable: true})
  channelId?: string;

  @Column({ nullable: true})
  content?: string;

  @Column({ nullable: true})
  signature?: string;

  @CreateDateColumn()
  createdDate: Date;
}
