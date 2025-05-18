import { Module } from '@nestjs/common';
import { ChatService } from './services/chat.service';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageEntity } from './entities/message.entity';
import { ChatRoomEntity } from './entities/room.entity';
import { PostModule } from '../post/post.module';
import { MessageService } from './services/message.service';

@Module({
  imports: [

    TypeOrmModule.forFeature([MessageEntity, ChatRoomEntity]),
  
  ],
  providers: [ ChatGateway,ChatService,MessageService],
  // controllers:[ChatController]
})
export class ChatModule {}
