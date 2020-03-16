import { INestApplication } from '@nestjs/common';
import * as supertest from 'supertest';

export class ContactsApi {
  constructor(private readonly app: INestApplication, private readonly testId: string) {}

  async initHandshake(userId: number, contactName: string) {
    const response = await supertest
      .agent(this.app.getHttpServer())
      .post(`/contacts/generate-init-handshake/${userId}/${contactName}-${this.testId}`)
      .expect(201);
    return response.body;
  }

  async acceptInitHandshake(userId, contactName, handshake) {
    const response = await supertest
      .agent(this.app.getHttpServer())
      .post(`/contacts/accept-init-handshake/${userId}/${contactName}-${this.testId}`)
      .send(handshake)
      .expect(201);
    return response.body;
  }

  async replyHandshake(userId, contactName) {
    const response = await supertest
      .agent(this.app.getHttpServer())
      .post(`/contacts/generate-reply-handshake/${userId}/${contactName}-${this.testId}`)
      .expect(201);
    return response.body;
  }

  async acceptReplyHandshake(userId, contactName, handshake) {
    const response = await supertest
      .agent(this.app.getHttpServer())
      .post(`/contacts/accept-reply-handshake/${userId}/${contactName}-${this.testId}`)
      .send(handshake)
      .expect(201);
    return response.body;
  }

  // via development modules
  async getMasterKey(userId, contactName) {
    const response = await supertest
      .agent(this.app.getHttpServer())
      .get(`/development/generate-master-key/${userId}/${contactName}-${this.testId}`)
      .expect(200);
    return response.body;
  }

  async getContact(userId, contactName) {
    const response = await supertest
      .agent(this.app.getHttpServer())
      .get(`/development/contact/${userId}/${contactName}-${this.testId}`)
      .expect(200);
    return response.body;
  }

  async verifySignature(signature, oneuseKey, signingKey) {
    const response = await supertest
      .agent(this.app.getHttpServer())
      .get(
        `/development/cryptography/verify-signature` +
          `/${encodeURIComponent(signature)}` +
          `/${encodeURIComponent(oneuseKey)}` +
          `/${encodeURIComponent(signingKey)}`,
      )
      .expect(200);
    return response.body;
  }
}
