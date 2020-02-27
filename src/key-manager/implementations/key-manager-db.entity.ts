import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/users.entity';

@Entity()
export class DbKeyPair {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  privateKey: string;

  @Column()
  publicKey: string;

  @OneToOne(type => User)
  @JoinColumn()
  user: User;
}
