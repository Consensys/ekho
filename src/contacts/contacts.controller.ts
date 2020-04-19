import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Contact } from './contacts.entity';
import { ContactsService } from './contacts.service';
import ContactHandshakeDto from './dto/contact-handshake.dto';
import ContactDto from './dto/contact.dto';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get(':userId')
  async getContactsForUser(@Param('userId') userId: number): Promise<ContactDto[]> {
    return this.contactsService.getByUser(userId);
  }

  @Get(':userId/:contactId')
  async findContactByUser(@Param('userId') userId: number, @Param('contactId') contactId: number): Promise<Contact> {
    return this.contactsService.findOneContact(userId, contactId);
  }

  @Post('generate-init-handshake/:userId/:contactName')
  async initHandshake(
    @Param('userId') userId: number,
    @Param('contactName') contactName: string,
  ): Promise<ContactHandshakeDto> {
    return this.contactsService.initHandshake(userId, contactName);
  }

  @Post('accept-init-handshake/:userId/:contactName')
  async acceptInitHandshake(
    @Param('userId') userId: number,
    @Param('contactName') contactName: string,
    @Body() initHandshake: ContactHandshakeDto,
  ): Promise<void> {
    await this.contactsService.acceptInitHandshake(userId, contactName, initHandshake);
  }

  @Post('generate-reply-handshake/:userId/:contactName')
  async generateReplyHandshake(
    @Param('userId') userId: number,
    @Param('contactName') contactName: string,
  ): Promise<ContactHandshakeDto> {
    return this.contactsService.replyHandshake(userId, contactName);
  }

  @Post('accept-reply-handshake/:userId/:contactName')
  async acceptReplyHandshake(
    @Param('userId') userId: number,
    @Param('contactName') contactName: string,
    @Body() replyHandshake: ContactHandshakeDto,
  ): Promise<void> {
    await this.contactsService.acceptReplyHandshake(userId, contactName, replyHandshake);
  }
}
