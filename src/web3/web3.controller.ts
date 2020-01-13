import { Controller, Post, Param } from '@nestjs/common';
import { Web3Service } from './web3.service';

@Controller('web3')
export class Web3Controller {
    constructor(private readonly web3Service: Web3Service) {}

    @Post(':message')
    async post(@Param('message') message: string): Promise<string> {
        return this.web3Service.broadcastNotification(message);
    }
}
