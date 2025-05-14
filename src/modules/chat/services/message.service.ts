import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from '../entites/message.entity';
import { Repository } from 'typeorm';
import { CreateMessageDto } from '../dtos/message.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class MessageService {
  constructor(
 
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async createMessage(roomId: string, msg: string, senderId: string) {
    let message = this.messageRepository.create({
      roomId,
      senderId,
      text:msg,
      sentAt: new Date(),
    });
    message = await this.messageRepository.save(message);
    return message;
  }
  async getRecentMessages(roomId: string) {
    const cachedMessages = await this.cacheManager.get(`messages:${roomId}`);
    if (cachedMessages) {
      return JSON.parse(cachedMessages as string);
    }
    const messages = await this.messageRepository.find({
      where: { roomId },
      order: { sentAt: 'DESC' },
      take: 50,
    });
    await this.cacheManager.set(`messages:${roomId}`, JSON.stringify(messages));
    return messages;
  }
}
