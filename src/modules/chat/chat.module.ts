import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';

@Module({})
export class ChatModule {

    private:[ChatGateway]
}
