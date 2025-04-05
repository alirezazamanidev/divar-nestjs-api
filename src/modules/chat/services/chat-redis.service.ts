import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ChatMessageEntity } from '../entities/chat-message.entity';

// تایپ برای پیام ذخیره‌شده در Redis
interface CachedChatMessage {
  id: string;
  senderId: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

@Injectable()
export class ChatRedisService {
  private readonly logger = new Logger(ChatRedisService.name);
  private readonly MESSAGE_TTL = 60 * 60 * 24 * 7; // 7 روز به ثانیه

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * Generates a Redis key for a chat room's message list.
   * @param roomId - The ID of the chat room
   * @returns A formatted Redis key
   */
  private getChatRoomKey(roomId: string): string {
    return `chat:room:${roomId}:messages`;
  }

  /**
   * Stores a chat message in Redis as part of a list.
   * @param message - The chat message entity to store
   */
  async storeMessage(message: ChatMessageEntity): Promise<void> {
    const roomKey = this.getChatRoomKey(message.chatRoomId);
    const messageData: CachedChatMessage = {
      id: message.id,
      senderId: message.senderId,
      message: message.message,
      createdAt: message.created_at.toISOString(),
      isRead: message.isRead,
    };

    try {
      // دریافت لیست فعلی یا مقدار خالی
      const currentMessages: string[] = (await this.cacheManager.get(roomKey)) || [];
      currentMessages.push(JSON.stringify(messageData));

      // ذخیره لیست به‌روز شده با تنظیم زمان انقضا (7 روز)
      await this.cacheManager.set(roomKey, currentMessages, this.MESSAGE_TTL);
    } catch (error) {
      this.logger.error(`Failed to store message for room ${message.chatRoomId}: ${error.message}`, error.stack);
      throw new Error('Unable to store chat message');
    }
  }

  /**
   * Retrieves recent messages from a chat room.
   * @param roomId - The ID of the chat room
   * @param limit - Number of messages to retrieve (default: 50)
   * @returns An array of parsed chat messages
   */
  async getRecentMessages(roomId: string, limit = 50): Promise<CachedChatMessage[]> {
    const roomKey = this.getChatRoomKey(roomId);

    try {
      const messages: string[] = (await this.cacheManager.get(roomKey)) || [];
      if (!Array.isArray(messages)) {
        return [];
      }

      // تبدیل پیام‌ها به فرمت تایپ‌شده و محدود کردن تعداد
      const parsedMessages = messages
        .map((msg) => {
          try {
            return JSON.parse(msg) as CachedChatMessage;
          } catch {
            return null;
          }
        })
        .filter((msg): msg is CachedChatMessage => msg !== null)
        .slice(-limit); // گرفتن آخرین پیام‌ها

      return parsedMessages;
    } catch (error) {
      this.logger.error(`Failed to retrieve messages for room ${roomId}: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Marks all unread messages as read for a specific user in a chat room.
   * @param roomId - The ID of the chat room
   * @param userId - The ID of the user marking messages as read
   */
  async markMessagesAsRead(roomId: string, userId: string): Promise<void> {
    const roomKey = this.getChatRoomKey(roomId);

    try {
      const messages: string[] = (await this.cacheManager.get(roomKey)) || [];
      if (!Array.isArray(messages)) {
        return;
      }

      const updatedMessages = messages.map((msg) => {
        const messageData = JSON.parse(msg) as CachedChatMessage;
        if (messageData.senderId !== userId && !messageData.isRead) {
          messageData.isRead = true;
        }
        return JSON.stringify(messageData);
      });

      // ذخیره لیست به‌روز شده با تنظیم زمان انقضا
      await this.cacheManager.set(roomKey, updatedMessages, this.MESSAGE_TTL);
    } catch (error) {
      this.logger.error(`Failed to mark messages as read for room ${roomId}, user ${userId}: ${error.message}`, error.stack);
      throw new Error('Unable to mark messages as read');
    }
  }

  /**
   * Retrieves the count of unread messages for a user in a chat room.
   * @param roomId - The ID of the chat room
   * @param userId - The ID of the user
   * @returns The number of unread messages
   */
  async getUnreadCount(roomId: string, userId: string): Promise<number> {
    const roomKey = this.getChatRoomKey(roomId);

    try {
      const messages: string[] = (await this.cacheManager.get(roomKey)) || [];
      if (!Array.isArray(messages)) {
        return 0;
      }

      return messages.reduce((count, msg) => {
        const messageData = JSON.parse(msg) as CachedChatMessage;
        return messageData.senderId !== userId && !messageData.isRead ? count + 1 : count;
      }, 0);
    } catch (error) {
      this.logger.error(`Failed to get unread count for room ${roomId}: ${error.message}`, error.stack);
      return 0;
    }
  }
}