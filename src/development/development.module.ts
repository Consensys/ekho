import { Module } from '@nestjs/common';
import { ContactsModule } from '../contacts/contacts.module';
import { CryptographyModule } from '../cryptography/cryptography.module';
import { UsersModule } from '../users/users.module';
import { DevelopmentController } from './development.controller';

@Module({
  imports: [CryptographyModule, ContactsModule, UsersModule],
  controllers: [DevelopmentController],
})
export class DevelopmentModule {}
