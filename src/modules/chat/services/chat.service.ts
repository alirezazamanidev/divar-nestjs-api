import { Injectable, Logger, NotFoundException, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoomEntity } from '../entities/chat-room.entity';
import { ChatMessageEntity } from '../entities/chat-message.entity';
import { CreateChatRoomDto, SendMessageDto } from '../dtos';
import { ChatRedisService } from './chat-redis.service';
import { PostEntity } from '../../post/entities/post.entity';
import { WsException } from '@nestjs/websockets';
import { StatusEnum } from 'src/common/enums';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatRoomEntity)
    private chatRoomRepository: Repository<ChatRoomEntity>,
    @InjectRepository(ChatMessageEntity)
    private chatMessageRepository: Repository<ChatMessageEntity>,
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
    private chatRedisService: ChatRedisService,
  ) {}

  /**
   * Create a new chat room for a post
   */
  async createChatRoom(createChatRoomDto: CreateChatRoomDto, userId: string): Promise<ChatRoomEntity> {
    try {
      const { postId } = createChatRoomDto;

      // Get the post to verify it exists and get the seller ID
      const post = await this.postRepository.findOne({ where: { id: postId ,isActive:true,status:StatusEnum.Published} });
      if (!post) {
        throw new WsException('Post not found');
      }
      if(post.userId===userId) throw new WsException('You cannot message your own post')
      
      // Check if chat messages are allowed for this post
      if (!post.allowChatMessages) {
        throw new Error('Chat messages are not allowed for this post');
      }

      // Check if a chat room already exists between these users for this post
      const existingRoom = await this.chatRoomRepository.findOne({
        where: {
          postId,
          buyerId:userId,
          sellerId: post.userId,
        },
      });

      if (existingRoom) {
        return existingRoom;
      }

      // Create a new chat room
      const chatRoom = this.chatRoomRepository.create({
        postId,
        buyerId:userId,
        sellerId: post.userId,
        isActive: true,
      });

      return this.chatRoomRepository.save(chatRoom);
    } catch (error) {
      this.logger.error(`Failed to create chat room: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all chat rooms for a user (either as buyer or seller)
   */
  async getUserChatRooms(userId: string): Promise<ChatRoomEntity[]> {
    try {
      return this.chatRoomRepository.find({
        where: [
          { buyerId: userId, isActive: true },
          { sellerId: userId, isActive: true },
        ],
        relations: ['post', 'buyer', 'seller','messages'],
      });
    } catch (error) {
      this.logger.error(`Failed to get user chat rooms: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get chat room by ID
   */
  async getChatRoomById(roomId: string, userId: string): Promise<ChatRoomEntity> {
   
    try {
      let chatRoom = await this.chatRoomRepository.findOne({
        where: { id: roomId },
        relations: ['post', 'buyer', 'seller','messages'],
        
      });

      if (!chatRoom) {
        throw new WsException('Chat room not found');
      }

      // Verify the user is part of this chat room
      if (chatRoom.buyerId !== userId && chatRoom.sellerId !== userId) {
        throw new Error('You do not have access to this chat room');
      }
      return chatRoom;
    } catch (error) {
      this.logger.error(`Failed to get chat room: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send a message in a chat room
   */
  async sendMessage(sendMessageDto: SendMessageDto, userId: string): Promise<ChatMessageEntity> {
    try {
      const { chatRoomId, message } = sendMessageDto;

  
      
      // Get the chat room
      const chatRoom = await this.chatRoomRepository.findOne({
        where: { id: chatRoomId },
      });

      if (!chatRoom) {
        throw new NotFoundException('Chat room not found');
      }

      // Verify the user is part of this chat room
      if (chatRoom.buyerId !== userId && chatRoom.sellerId !== userId) {
        throw new Error('You do not have access to this chat room');
      }

      // Create and save the message
      const chatMessage = this.chatMessageRepository.create({
        chatRoomId,
        senderId: userId,
        message,
        isRead: false,
      });

      const savedMessage = await this.chatMessageRepository.save(chatMessage);
      
      // Store in Redis for real-time access
      await this.chatRedisService.storeMessage(savedMessage);

      return savedMessage;
    } catch (error) {
      this.logger.error(`Failed to send message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get chat messages for a room
   */
  async getChatMessages(roomId: string, userId: string, limit = 50): Promise<any[]> {
    try {
      // Check if user is part of the chat room
      const chatRoom = await this.chatRoomRepository.findOne({
        where: { id: roomId },
      });

      if (!chatRoom) {
        throw new NotFoundException('Chat room not found');
      }

      if (chatRoom.buyerId !== userId && chatRoom.sellerId !== userId) {
        throw new Error('You do not have access to this chat room');
      }

      // First try to get messages from Redis for better performance
      const redisMessages = await this.chatRedisService.getRecentMessages(roomId, limit);
      
      if (redisMessages.length > 0) {
        // Mark messages as read
        await this.chatRedisService.markMessagesAsRead(roomId, userId);
        return redisMessages;
      }
      
      // If Redis doesn't have the messages, get from database
      const messages = await this.chatMessageRepository.find({
        where: { chatRoomId: roomId },
        order: { created_at: 'DESC' },
        take: limit,
      });

      // Mark messages as read in database
      if (messages.length > 0) {
        await this.chatMessageRepository.update(
          {
            chatRoomId: roomId,
            senderId: chatRoom.buyerId === userId ? chatRoom.sellerId : chatRoom.buyerId,
            isRead: false,
          },
          { isRead: true },
        );
      }

      return messages.reverse();
    } catch (error) {
      this.logger.error(`Failed to get chat messages: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(roomId: string, userId: string): Promise<void> {
    try {
      // Check if user is part of the chat room
      const chatRoom = await this.chatRoomRepository.findOne({
        where: { id: roomId },
      });

      if (!chatRoom) {
        throw new WsException('Chat room not found');
      }

      if (chatRoom.buyerId !== userId && chatRoom.sellerId !== userId) {
        throw new Error('You do not have access to this chat room');
      }

      // Mark as read in Redis for real-time updates
      await this.chatRedisService.markMessagesAsRead(roomId, userId);

      // Mark as read in database
      await this.chatMessageRepository.update(
        {
          chatRoomId: roomId,
          senderId: chatRoom.buyerId === userId ? chatRoom.sellerId : chatRoom.buyerId,
          isRead: false,
        },
        { isRead: true },
      );
    } catch (error) {
      this.logger.error(`Failed to mark messages as read: ${error.message}`, error.stack);
      throw error;
    }
  }
} 