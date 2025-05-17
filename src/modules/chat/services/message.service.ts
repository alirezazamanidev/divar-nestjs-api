import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from '../entities/message.entity';
import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class MessageService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,

    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
  ) {}

  async create(text: string, roomId: string, senderId: string): Promise<MessageEntity> {
    const cacheKey = `messages:room:${roomId}`;
  
    // 1. ساخت پیام جدید
    const message = this.messageRepository.create({
      roomId,
      text,
      senderId,
    });
  
    const savedMessage = await this.messageRepository.save(message);
  
    // 2. تلاش برای گرفتن کش موجود
    const cachedMessages = await this.cacheManager.get<MessageEntity[]>(cacheKey);
  
    if (cachedMessages) {
      // 3. اضافه کردن پیام به کش و حفظ حداکثر 50 پیام
      const updatedMessages = [...cachedMessages, savedMessage].slice(-50); // آخرین ۵۰ پیام
      await this.cacheManager.set(cacheKey, updatedMessages, 3600);
    }
  
    return savedMessage;
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
