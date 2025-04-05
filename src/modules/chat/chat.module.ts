import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './services/chat.service';

import { ChatGateway } from './chat.gateway';
import { ChatRoomEntity } from './entities/chat-room.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { PostEntity } from '../post/entities/post.entity';
import { ChatRedisService } from './services/chat-redis.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoomEntity, ChatMessageEntity, PostEntity]),
  ],
  
  controllers: [ChatController],
  providers: [ChatService, ChatRedisService, ChatGateway],
  exports: [ChatService, ChatRedisService],
})
export class ChatModule {} 