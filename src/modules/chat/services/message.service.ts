import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from '../entites/message.entity';
import { Repository } from 'typeorm';
import { CreateMessageDto } from '../dtos/send-message.dto';
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
    const message = this.messageRepository.create({
      text: data.message,
      sentAt: new Date().toISOString(),
      senderId: data.senderId,
      roomId: data.roomId,
    });
    const savedMessage = await this.messageRepository.save(message);
    // update last message in cache
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
  }
}
