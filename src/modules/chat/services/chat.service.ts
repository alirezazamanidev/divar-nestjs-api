import { InjectRepository } from '@nestjs/typeorm';
import { ChatEntity } from '../entites/chat.entity';
import { Repository } from 'typeorm';
import { CreateRoomDto } from '../dtos/chat.dto';
import { PostEntity } from '../../post/entities/post.entity';
import { WsException } from '@nestjs/websockets';
import { StatusEnum } from 'src/common/enums';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CreateMessageDto } from '../dtos/message.dto';

export class ChatService {
  constructor(
    @InjectRepository(ChatEntity)
    private readonly chatRepository: Repository<ChatEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getRoomDetails(roomId: string) {
    let room = await this.cacheManager.get(`chat:${roomId}`);
    if (room) {
      return JSON.parse(room as string);
    }
    room = await this.chatRepository.findOne({
      where: { id: roomId },
      relations: ['post', 'sender', 'receiver'],
      select: {
        receiver: {
          id: true,
          username: true,
        },
        sender: {
          id: true,
          username: true,
        },
        isActive: true,
        post: {
          id: true,
          mediaFiles: true,
        },
      },
    });

    await this.cacheManager.set(`chat:${roomId}`, JSON.stringify(room));
    return room;
  }
  async createRoom(data: CreateRoomDto, userId: string) {
    const post = await this.postRepository.findOne({
      where: {
        id: data.postId,
        allowChatMessages: true,
        isActive: true,
        status: StatusEnum.Published,
      },
      relations: ['user'],
    });
    if (!post) {
      throw new WsException('Post not found');
    }
    if (post.userId === userId) {
      throw new WsException('You cannot create a room for your own post');
    }
    let room = await this.chatRepository.findOne({
      where: [
        {
          postId: data.postId,
          senderId: userId,
          receiverId: post.userId,
        },
        {
          postId: data.postId,
          senderId: post.userId,
          receiverId: userId,
        },
      ],
    });
    if (!room) {
      room = this.chatRepository.create({
        postId: data.postId,
        senderId: userId,
        receiverId: post.userId,
      });
      room = await this.chatRepository.save(room);
    }

    await this.cacheManager.set(`chat:${room.id}`, JSON.stringify(room));
    return room;
  }
}
