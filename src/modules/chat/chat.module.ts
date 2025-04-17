import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatEntity } from './entites/chat.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from '../post/entities/post.entity';
import { ChatService } from './services/chat.service';
import { CacheModule } from '@nestjs/cache-manager';
import Keyv from 'keyv';
import { MessageEntity } from './entites/message.entity';
import { MessageService } from './services/message.service';
@Module({
    imports:[TypeOrmModule.forFeature([ChatEntity,PostEntity,MessageEntity])],
  providers: [ChatGateway,ChatService,MessageService]
})
export class ChatModule {
}
