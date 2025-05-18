import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from '../entities/message.entity';
import { DataSource, Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ChatRoomEntity } from '../entities/room.entity';

@Injectable()
export class MessageService {
  constructor(
    private readonly dataSource:DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
  ) {}

  async create(text: string, roomId: string, senderId: string): Promise<MessageEntity> {
    const cacheKey = `messages:room:${roomId}`;
   return await this.dataSource.transaction(async(manager)=>{
    const message = manager.create(MessageEntity,{
      roomId,
      text,
      senderId,
    });
    const savedMessage = await manager.save(MessageEntity,message);
    const cachedMessages = await this.cacheManager.get<MessageEntity[]>(cacheKey);

    // update last massage for room
    await manager.update(ChatRoomEntity,{id:roomId},{lastMessage:savedMessage});
    // save to cache
    if (cachedMessages) {
      
      const updatedMessages = [...cachedMessages, savedMessage].slice(-50);
      await this.cacheManager.set(cacheKey, updatedMessages, 3600);
    }
  
    return savedMessage;
   })
    
  
  
    // 2. تلاش برای گرفتن کش موجود
  
 
  }
  
  async recentMessages(roomId: string) {
    const key = `messages:room:${roomId}`;
    const cacheMessages = await this.cacheManager.get<MessageEntity[]>(key);
    if (cacheMessages && cacheMessages.length > 0) return cacheMessages;

    const messages = await this.messageRepository.find({
      where: { roomId },
      take: 50,
      order: { sentAt: 'ASC' },
    });

    if (messages.length > 0) {
      await this.cacheManager.set(key, messages, 3600); // 1 hour cache
    }

    return messages;
  }
}
