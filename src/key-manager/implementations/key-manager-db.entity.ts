import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class DbKeyPair {
  @PrimaryColumn()
  id: number;

  @Column()
  privateKey: string;

  @Column()
  publicKey: string;
}
