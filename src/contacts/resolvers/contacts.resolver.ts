import { Resolver } from '@nestjs/graphql';
import { FieldResolver, Root } from 'type-graphql';
import { User } from '../../users/entities/users.entity';
import { Contact } from '../contacts.entity';
import { ContactsService } from '../contacts.service';

@Resolver(of => Contact)
export class ContactsResolver {
  constructor(private readonly contactsService: ContactsService) {}

  @FieldResolver(returns => [Contact])
  public async contacts(@Root() user: User): Promise<Contact[]> {
    return this.contactsService.getByUser(user.id);
  }

  // @Mutation(returns => ContactHandshakeDto)
  // public async initHandshake(
  //   @Arg('userId') userId: number,
  //   @Arg('contactName') contactName: string): Promise<ContactHandshakeDto> {
  //     return this.contactsService.initHandshake(userId, contactName);
  // }

  // @Mutation(returns => ContactHandshakeDto)
  // public async acceptInitHandshake(
  //   @Arg('userId') userId: number,
  //   @Arg('contactName') contactName: string): Promise<ContactHandshakeDto> {
  //     return this.contactsService.initHandshake(userId, contactName);
  // }
}
