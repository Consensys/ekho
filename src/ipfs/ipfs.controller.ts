import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { IpfsService } from './ipfs.service';
import { IpfsMessageDto } from './dto/ipfs-message.dto';

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
