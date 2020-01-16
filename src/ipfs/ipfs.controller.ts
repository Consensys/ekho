import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IpfsMessageDto } from './dto/ipfs-message.dto';
import { IpfsService } from './ipfs.service';

@Controller('ipfs')
export class IpfsController {
  constructor(private readonly ipfsService: IpfsService) {}

  @Get(':path')
  async get(@Param('path') path: string): Promise<IpfsMessageDto> {
    return this.ipfsService.retrieve(path);
  }

  @Post()
  async post(@Body() data: IpfsMessageDto): Promise<string> {
    return this.ipfsService.store(data);
  }
}
