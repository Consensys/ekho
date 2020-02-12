import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptographyModule } from '../cryptography/cryptography.module';
import { VaultModule } from '../vault/vault.module';
import { User } from './entities/users.entity';
import { UsersResolver } from './resolvers/users.resolver';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), CryptographyModule, VaultModule],
  exports: [UsersService],
  providers: [UsersService, UsersResolver],
  controllers: [UsersController],
})
export class UsersModule {}
