import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EkhoEvent } from '../../events/entities/events.entity';
import { ChannelMember } from './channelmembers.entity';

@Entity()
@ObjectType()
export class ChannelMessage {
  @Field(type => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(type => ChannelMember)
  @ManyToOne(
    type => ChannelMember,
    channelMember => channelMember.channelmessages,
  )
  channelMember: ChannelMember;

  @Field()
  @Column()
  messageContents: string;

  @Column({ default: 0 })
  nonce: number;

  @Column({ default: null })
  messageKey: string;

  @OneToOne(type => EkhoEvent)
  @JoinColumn()
  event: EkhoEvent;
}
