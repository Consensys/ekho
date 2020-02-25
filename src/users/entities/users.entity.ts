import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ChannelMember } from '../../channels/entities/channelmembers.entity';
import { Contact } from '../../contacts/contacts.entity';

@Entity()
@ObjectType()
@Unique('UQ_NAME', ['name'])
export class User {
  @Field(type => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ length: 500 })
  name: string;

  // TODO remove private signing key when channels are merged
  //      removing now will cause lots of conflicts on on-going work
  @Column({ nullable: true })
  privateSigningKey?: string;

  @Field()
  @Column()
  publicSigningKey?: string;

  @Field(type => [ChannelMember], { nullable: true })
  @OneToMany(
    type => ChannelMember,
    channelmember => channelmember.user,
  )
  channelmembers: ChannelMember[];

  @Field(type => [Contact], { nullable: true })
  @OneToMany(
    type => Contact,
    contact => contact.user,
  )
  contacts: Contact[];
}
