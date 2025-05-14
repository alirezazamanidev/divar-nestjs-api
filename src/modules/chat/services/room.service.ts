import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { CreateRoomDto } from '../dtos/chat.dto';
import { PostEntity } from '../../post/entities/post.entity';
import { WsException } from '@nestjs/websockets';
import { StatusEnum } from 'src/common/enums';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CreateMessageDto } from '../dtos/message.dto';
import { RoomEntity } from '../entites/room.entity';

export class RoomService {
  constructor(
    @InjectRepository(RoomEntity)
    private readonly RoomRepository: Repository<RoomEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async create(postId: string, sellerId: string, buyerId: string) {
    let room = await this.RoomRepository.findOne({
      where: {
        buyerId,
        sellerId,
        postId,
      },
    });
    if (room) return room;
    room = this.RoomRepository.create({ postId, sellerId, buyerId });
    room = await this.RoomRepository.save(room);
    return room;
  }
}
