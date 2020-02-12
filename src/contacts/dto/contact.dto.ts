import { Field, InputType } from 'type-graphql';
import { Contact } from '../contacts.entity';

@InputType({ description: 'Contact name' })
export default class ContactDto implements Partial<Contact> {
  @Field()
  name: string;
}
