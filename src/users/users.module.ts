import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptographyModule } from '../cryptography/cryptography.module';
import { UsersController } from './users.controller';
import { User } from './users.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), CryptographyModule],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
