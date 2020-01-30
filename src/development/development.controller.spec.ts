import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactsModule } from '../contacts/contacts.module';
import { CryptographyModule } from '../cryptography/cryptography.module';
import { UsersModule } from '../users/users.module';
import { DevelopmentController } from './development.controller';

describe('Development Controller', () => {
  let controller: DevelopmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(), CryptographyModule, UsersModule, ContactsModule],
      controllers: [DevelopmentController],
    }).compile();

    controller = module.get<DevelopmentController>(DevelopmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
