import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, Generated, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ChannelMember } from '../channels/entities/channelmembers.entity';
import { User } from '../users/entities/users.entity';

@Entity()
@ObjectType()
@Unique('UQ_CONTACT_USER_NAME', ['user', 'name'])
export class Contact {
  @Field(type => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ length: 500 })
  name: string;

  @Field()
  @Column()
  @Generated('uuid')
  identifier: string;

  @Field()
  @Column()
  handshakePrivateKey: string;

  @Field()
  @Column()
  handshakePublicKey: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  signingKey?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  oneuseKey?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  signature?: string;

  @Field(type => [ChannelMember], { nullable: true })
  @OneToMany(
    type => ChannelMember,
    channelmember => channelmember.contact,
  )
  channelmembers: ChannelMember[];

  @Field(type => User)
  @ManyToOne(
    type => User,
    user => user.contacts,
  )
  user: User;
}
