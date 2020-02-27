import { Field, ObjectType } from 'type-graphql';
import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@ObjectType()
@Entity()
@Unique('UQ_USER_CHANNELID', ['to', 'channelId'])
export class Message {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  timestamp: Date;

  @Field()
  @Column()
  from: string;

  @Field()
  @Column()
  to: string;

  @Field()
  @Column()
  content: string;

  @Field()
  @Column()
  ipfsPath: string;

  @Field()
  @Column()
  txHash: string;

  @Field()
  @Column()
  channelId: string;
}
