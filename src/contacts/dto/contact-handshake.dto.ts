import { Field, InputType } from 'type-graphql';

@InputType()
export default class ContactHandshakeDto {
  @Field()
  from: string;

  @Field()
  to: string;

  @Field()
  identifier: string;

  @Field()
  oneuseKey: string;

  @Field()
  signingKey: string;

  @Field()
  signature: string;
}
