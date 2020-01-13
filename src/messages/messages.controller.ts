import { Controller, Post, Body, Query, Get, Param } from '@nestjs/common';
import SendMessageDto from './dto/send-message.dto';
import { MessagesService } from './messages.service';
import { Message } from './messages.entity';

@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService) { }
  @Post()
  async sendMessage(@Body() message: SendMessageDto): Promise<void> {
    await this.messagesService.sendMessage(message.from, message.to, message.channelId, message.content);
  }

  @Get()
  async getAllMessages(): Promise<Message[]> {
    return this.messagesService.findAll();
  }

  @Get('/:user')
  async getMessages(@Param('user') user: string): Promise<Message[]> {
    const messages: Message[] = [];
    // TODO: for now we're just simulating a sequence of channel id
    //       example: ['bob-1', 'bob-2', 'bob-3', ...]
    let i = 1;
    while(true) {
      const message = await this.messagesService.findForUser(user, `${user}-${i++}`);
      if (message) {
        messages.push(message);
      } else {
        break;
      }
    }
    return messages;
  }
}
