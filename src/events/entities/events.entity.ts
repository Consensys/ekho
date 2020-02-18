import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Block } from './blocks.entity';

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

  @ManyToOne(
    type => Block,
    block => block.blockevents,
  )
  @JoinColumn({ name: 'blockId' })
  block: Block;

  @Column({ nullable: false })
  processed: boolean;
}
