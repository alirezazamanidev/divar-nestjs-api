import { Module } from '@nestjs/common';
import { ChatService } from './services/chat.service';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageEntity } from './entities/message.entity';
import { ChatRoomEntity } from './entities/room.entity';

import { MessageService } from './services/message.service';
import { PostEntity } from '../post/entities/post.entity';
import { ChatController } from './chat.controller';

@Module({
  imports: [

    TypeOrmModule.forFeature([MessageEntity, ChatRoomEntity,PostEntity]),
  
  ],
  providers: [ ChatGateway,ChatService,MessageService],
  controllers:[ChatController]
})
export class ChatModule {}
