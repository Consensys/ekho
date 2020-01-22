import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptographyModule } from '../cryptography/cryptography.module';
import { UsersModule } from '../users/users.module';
import { ContactsController } from './contacts.controller';
import { Contact } from './contacts.entity';
import { ContactsService } from './contacts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contact]), UsersModule, CryptographyModule],
  providers: [ContactsService],
  controllers: [ContactsController],
})
export class ContactsModule {}
