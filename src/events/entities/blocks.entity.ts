import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { EkhoEvent } from './events.entity';

@Entity()
@Unique('UQ_BLOCKNUMBER', ['blockNumber'])
export class Block {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  blockNumber: number;

  @OneToMany(
    type => EkhoEvent,
    event => event.block,
    { cascade: true },
  )
  blockevents: EkhoEvent[];
}
