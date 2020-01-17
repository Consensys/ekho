import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique('UQ_NAME', ['name'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  name: string;

  @Column({ type: 'bytea', nullable: true })
  privateSigningKey?: Buffer;

  @Column({ type: 'bytea', nullable: true })
  publicSigningKey?: Buffer;
}
