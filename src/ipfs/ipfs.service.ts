import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ipfsClient from 'ipfs-http-client';
import { IpfsMessageDto } from './dto/ipfs-message.dto';

@Injectable()
export class IpfsService {
    private readonly ipfs;
    constructor(private readonly configService: ConfigService) {
        const host = this.configService.get<string>('ipfs.host');
        const port = this.configService.get<number>('ipfs.port');
        const protocol = 'https';
        this.ipfs = ipfsClient({ host, port, protocol });
    }

    /**
     * Fetch a file from IPFS that is addressed by a valid IPFS Path.
     * https://github.com/ipfs/interface-js-ipfs-core/blob/master/SPEC/FILES.md#get
     * @param ipfsPath IPFS Path
     */
    async retrieve(ipfsPath: string): Promise<IpfsMessageDto> {
        const [file] = await this.ipfs.get(ipfsPath);
        return JSON.parse(file.content.toString('utf8'));
    }

    /**
     * Add files and data to IPFS.
     * https://github.com/ipfs/interface-js-ipfs-core/blob/master/SPEC/FILES.md#add
     * @param data data message to be added to IPFS
     */
    async store(data: IpfsMessageDto): Promise<string> {
        // this will perform badly with huge messages
        // check later how to use streams
        const stringData = JSON.stringify(data);
        const bufferedData = Buffer.from(stringData, 'utf-8');
        const [result] = await this.ipfs.add(bufferedData);
        return result.path;
    }
}
