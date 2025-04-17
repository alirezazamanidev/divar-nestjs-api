import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from '../entites/message.entity';
import { Repository } from 'typeorm';
import { CreateMessageDto } from '../dtos/message.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ChatEntity } from '../entites/chat.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(ChatEntity)
    private readonly chatRepository: Repository<ChatEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async createMessage(data: CreateMessageDto) {
    try {
        
      const message = this.messageRepository.create({
        text: data.message,
        sentAt: new Date(),
        senderId: data.senderId,
        roomId: data.roomId,
      });
      
      const savedMessage = await this.messageRepository.save(message);
      return savedMessage
      // update last message in chat
      await this.chatRepository.update(
        { id: data.roomId },
        { lastMessageAt: new Date() },
      );
      
      // Get existing messages from cache or initialize empty array
      const existingMessagesStr = await this.cacheManager.get(
        `messages:${data.roomId}`,
      );
      const existingMessages = existingMessagesStr
        ? JSON.parse(existingMessagesStr as string)
        : [];

      // Add new message to the list
      const updatedMessages = [...existingMessages, savedMessage];

      // Store updated messages list in cache
      await this.cacheManager.set(
        `messages:${data.roomId}`,
        JSON.stringify(updatedMessages),
      );
      
      return savedMessage;
    } catch (error) {

      // Re-throw other errors
      throw error;
    }
  }
  async getRecentMessages(roomId:string){
    const cachedMessages=await this.cacheManager.get(`messages:${roomId}`);
    if(cachedMessages){
      return JSON.parse(cachedMessages as string);
    }
    const messages=await this.messageRepository.find({
      where:{roomId},
      order:{sentAt:'DESC'},
      take:50
    })
    await this.cacheManager.set(`messages:${roomId}`,JSON.stringify(messages));
    return messages;
  }
}
