import { INestApplication } from '@nestjs/common';
import BroadcastChannelLinkDto from 'src/channels/dto/link-broadcastchannel.dto';
import * as supertest from 'supertest';

export class ChannelsApi {
  constructor(private readonly app: INestApplication, private readonly testId: string) {}

  async createChannel(name: string, userId: number, contactId: number) {
    const response = await supertest
      .agent(this.app.getHttpServer())
      .post('/channels')
      .send({ name: `${name}-${this.testId}`, userId, contactId })
      .expect(201);
    return response.body;
  }

  async createChannelMessage(message: string, userId: number, channelId: number) {
    const response = await supertest
      .agent(this.app.getHttpServer())
      .post('/channels/message')
      .send({ messageContents: `${message}`, userId: `${userId}`, channelId: `${channelId}` })
      .expect(201);
    return response.body;
  }

  async processEvents(userId: number) {
    const response = await supertest
      .agent(this.app.getHttpServer())
      .get('/channels/refresh?userId=' + userId)
      .expect(200);
    return response.body;
  }

  async getUserMessages(userId) {
    const response = await supertest
      .agent(this.app.getHttpServer())
      .get(`/channels/message?contactId=${userId}`)
      .expect(200);
    return response.body;
  }

  async createBroadcastChannel(name: string, userId: number) {
    const response = await supertest
      .agent(this.app.getHttpServer())
      .post('/channels/broadcast')
      .send({ name: `${name}`, userId: `${userId}` })
      .expect(201);
    return response.body;
  }

  async followBroadcast(userId: number, channel: BroadcastChannelLinkDto) {
    const response = await supertest
      .agent(this.app.getHttpServer())
      .post(`/channels/broadcast/follow/${userId}`)
      .send(channel)
      .expect(201);
    return response.body;
  }

  async createBroadcastChannelListener(name: string, userId: number, contactId: number, key: string) {
    const response = await supertest
      .agent(this.app.getHttpServer())
      .post('/channels/broadcast/listener')
      .send({ name: `${name}`, userId: `${userId}`, contactId: `${contactId}`, key: `${key}` })
      .expect(201);
    return response.body;
  }
}
