import { INestApplication } from '@nestjs/common';
import * as supertest from 'supertest';

export class UsersApi {
  constructor(private readonly app: INestApplication, private readonly testId: string) {}

  async createUser(name: string) {
    const response = await supertest
      .agent(this.app.getHttpServer())
      .post('/users')
      .send({ name: `${name}-${this.testId}` })
      .expect(201);
    return response.body;
  }
}
