import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CryptographyModule } from './cryptography/cryptography.module';
import configuration from './config/configuration';

@Module({
  imports: [ConfigModule.forRoot({
    load: [configuration],
  }), CryptographyModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
