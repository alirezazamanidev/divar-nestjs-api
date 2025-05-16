import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageEntity } from './entities/message.entity';
import { ChatRoomEntity } from './entities/room.entity';

@Module({
  imports:[TypeOrmModule.forFeature([MessageEntity,ChatRoomEntity])],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
