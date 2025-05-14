import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { RoomEntity } from './entites/room.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from '../post/entities/post.entity';
import { RoomService } from './services/room.service';
import { MessageEntity } from './entites/message.entity';
import { MessageService } from './services/message.service';
@Module({
  imports: [TypeOrmModule.forFeature([RoomEntity, PostEntity, MessageEntity])],
  providers: [ChatGateway, RoomService, MessageService],
})
export class ChatModule {}
