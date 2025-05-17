import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoomEntity } from '../entities/room.entity';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import PostService from '../../post/post.service';

@Injectable()
export class ChatService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectRepository(ChatRoomEntity)
    private readonly roomRepository: Repository<ChatRoomEntity>,
    private readonly postService: PostService,
  ) {}

  async findOneById(id: string) {
    const cacheKey = `chatRoom:${id}`;
    const cachedRoom = await this.cacheManager.get<ChatRoomEntity>(cacheKey);
    if (cachedRoom) return cachedRoom;

    const room = await this.roomRepository.findOne({ where: { id } });
    if (!room) throw new NotFoundException('چت یافت نشد!');
    await this.cacheManager.set(cacheKey, room, 3600); // 1 hours

    return room;
  }

  async findAllForUser(userId: string) {
    const key = `user-rooms:${userId}`;
    const roomsCache = await this.cacheManager.get<ChatRoomEntity>(key);
    if (roomsCache) return roomsCache;
    const rooms = await this.roomRepository.find({
      where: [{ buyerId: userId }, { sellerId: userId }],
      relations: ['post'],
      select: {
        post: {
          id: true,
          title: true,
          slug: true,
          mediaFiles: true,
        },
      },
      order: { created_at: 'DESC' },
    });
    if (rooms.length > 0) {
      await this.cacheManager.set(key, rooms, 3600); // 1 hours
    }
    return rooms;
  }
  async createRoom(userId: string, postId: string) {
    const post = await this.postService.findOneById(postId);
    if (!post.allowChatMessages)
      throw new ForbiddenException('اجازه ارسال پیام ندارید!');
    let room = this.roomRepository.create({
      postId,
      sellerId: post.userId,
      buyerId: userId,
    });
    room = await this.roomRepository.save(room);
    return room;
  }
}
