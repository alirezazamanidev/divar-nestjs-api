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
import { PostEntity } from 'src/modules/post/entities/post.entity';
import { NotFoundMessages } from 'src/common/enums';

@Injectable()
export class ChatService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectRepository(ChatRoomEntity)
    private readonly roomRepository: Repository<ChatRoomEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
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
  async checkExist(
    userId: string,
    postId: string,
  ): Promise<ChatRoomEntity | null> {
    const room = await this.roomRepository.findOne({
      where: [
        { postId, buyerId: userId },
        { postId, sellerId: userId },
      ],
      select: ['id'],
    });

    return room;
  }

  async findAllForUser(userId: string) {
    const key = `rooms:user:${userId}`;
    const roomsCache = await this.cacheManager.get<ChatRoomEntity>(key);
    if (roomsCache) return roomsCache;
    const rooms = await this.roomRepository.find({
      where: [{ buyerId: userId }, { sellerId: userId }],
      relations: {
        lastMessage: true,
        post: true,
      },
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
    const post = await this.postRepository.findOne({
      where: { id: postId },
      select: ['userId', 'allowChatMessages'],
    });
    if (!post) throw new NotFoundException(NotFoundMessages.Post);
    if (!post.allowChatMessages)
      throw new ForbiddenException('اجازه ارسال پیام ندارید!');
    let room = this.roomRepository.create({
      postId,
      sellerId: post.userId,
      buyerId: userId,
    });
    room = await this.roomRepository.save(room);
 
   
    return room
  }
  async findOneChat(id:string){
    return  this.roomRepository.findOneOrFail({
      where: { id },
      relations: { post: true, lastMessage: true },
      select:{
        post:{
          id: true,
          title: true,
          slug: true,
          mediaFiles: true,
        },
        lastMessage:{
          id:true,
          text:true,
          seen:true,
          sentAt:true
        }
      }
    });
  }
}
