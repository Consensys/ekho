import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptographyModule } from '../cryptography/cryptography.module';
import { KeyManagerModule } from '../key-manager/key-manager.module';
import { User } from './entities/users.entity';
import { UsersResolver } from './resolvers/users.resolver';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), CryptographyModule, KeyManagerModule],
  exports: [UsersService],
  providers: [UsersService, UsersResolver],
  controllers: [UsersController],
})
export class UsersModule {}
