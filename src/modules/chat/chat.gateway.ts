import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { SendMessageDto, CreateChatRoomDto } from './dtos';
import { JwtService } from '@nestjs/jwt';
import { Logger, UseGuards } from '@nestjs/common';
import { parse } from 'cookie';
import { CookieNameEnum } from 'src/common/enums';
import { WsJwtGuard } from './guard/jwt.guard';
import { isJWT } from 'class-validator';
import { ChatService } from './services/chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private userSocketMap: Map<string, string> = new Map(); // userId -> socketId
  private socketUserMap: Map<string, string> = new Map(); // socketId -> userId

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // User data is already attached to socket.data.user by WsJwtGuard
      const userData = await this.auth(client);

      if (!userData || !userData.userId) {
        this.logger.error('Invalid user data in socket');
        client.disconnect();
        return;
      }

      const userId = userData.userId;

      // Store the connection in maps
      this.userSocketMap.set(userId, client.id);
      this.socketUserMap.set(client.id, userId);

      // Join user's personal room
      client.join(`user_${userId}`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = this.socketUserMap.get(client.id);

    if (userId) {
      this.userSocketMap.delete(userId);
      this.socketUserMap.delete(client.id);
      this.logger.log(`Client disconnected: ${client.id}, User: ${userId}`);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('roomId') roomId: string,
  ): Promise<void> {
    try {
      const userId = this.socketUserMap.get(client.id);

      if (!userId) {
        throw new WsException('user id not found');
      }

      // Verify the user is part of this chat room
      await this.chatService.getChatRoomById(roomId, userId);

      // Leave all previous rooms except the socket's own room
      const rooms = [...client.rooms].filter(room => 
        room !== client.id && room.startsWith('room_')
      );
      
      for (const room of rooms) {
        client.leave(room);
        this.logger.log(`User ${userId} left previous room: ${room}`);
      }

      // Join the new chat room
      client.join(`room_${roomId}`);

      // Mark messages as read when joining a room
      await this.chatService.markMessagesAsRead(roomId, userId);
     
      this.logger.log(`User ${userId} joined room: ${roomId}`);
    } catch (error) {
      this.logger.error(`Join room error: ${error.message}`);
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ): void {
    client.leave(`room_${roomId}`);
    const userId = this.socketUserMap.get(client.id);
    this.logger.log(`User ${userId} left room: ${roomId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessageDto,
  ) {
    try {
      const userId = this.socketUserMap.get(client.id);

      if (!userId) {
        return;
      }

      // Save the message using the service
      const message = await this.chatService.sendMessage(payload, userId);

      // Get the chat room to determine the recipient
      const chatRoom = await this.chatService.getChatRoomById(
        payload.chatRoomId,
        userId,
      );

      // Emit the message to the room
      this.server.to(`room_${payload.chatRoomId}`).emit('newMessage', message);

      // Also emit to the recipient's personal room in case they're not in the chat room
      const recipientId =
        userId === chatRoom.buyerId ? chatRoom.sellerId : chatRoom.buyerId;
      this.server.to(`user_${recipientId}`).emit('notification', {
        type: 'newMessage',
        roomId: payload.chatRoomId,
        message,
      });
      return { success: true, data: message };
    } catch (error) {
      this.logger.error(`Send message error: ${error.message}`);
      // Send error to client
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ): Promise<void> {
    try {
      const userId = this.socketUserMap.get(client.id);

      if (!userId) {
        return;
      }

      await this.chatService.markMessagesAsRead(roomId, userId);

      // Notify other user that messages have been read
      const chatRoom = await this.chatService.getChatRoomById(roomId, userId);
      const otherUserId =
        userId === chatRoom.buyerId ? chatRoom.sellerId : chatRoom.buyerId;

      this.server.to(`user_${otherUserId}`).emit('messagesRead', {
        roomId,
        readBy: userId,
      });
    } catch (error) {
      this.logger.error(`Mark read error: ${error.message}`);
    }
  }

  @SubscribeMessage('createChatRoom')
  async handleCreateChatRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() createChatRoomDto: CreateChatRoomDto,
  ): Promise<any> {
    try {
      const userId = this.socketUserMap.get(client.id);

      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      let chatRoom = await this.chatService.createChatRoom(
        createChatRoomDto,
        userId,
      );
      await this.chatService.sendMessage(
        { message: createChatRoomDto.message, chatRoomId: chatRoom.id },
        userId,
      );
      chatRoom=await this.chatService.getChatRoomById(chatRoom.id,userId); 
      // Notify the buyer about the new chat room
      if (chatRoom.buyerId) {
        this.server
          .to(`user_${chatRoom.buyerId}`)
          .emit('newChatRoom', chatRoom);
      }

      // Notify the seller about the new chat room
      if (chatRoom.sellerId) {
        this.server
          .to(`user_${chatRoom.sellerId}`)
          .emit('newChatRoom', chatRoom);
      }

      return { success: true, chatRoom };
    } catch (error) {
      this.logger.error(`Create chat room error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('getChatRooms')
  async handleGetUserChatRooms(
    @ConnectedSocket() client: Socket,
  ): Promise<any> {
    try {
      const userId = this.socketUserMap.get(client.id);
      if (!userId) throw new WsException('user id not found');
      const chatRooms = await this.chatService.getUserChatRooms(userId);
      return { success: true, data: chatRooms };
    } catch (error) {
      this.logger.error(`Get chat rooms error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('getChatMessages')
  async handleGetChatMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; limit?: number },
  ): Promise<any> {
    try {
      const userId = this.socketUserMap.get(client.id);
      
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const { roomId, limit = 50 } = data;
      const messages = await this.chatService.getChatMessages(
        roomId,
        userId,
        limit,
      );
      return { success: true, data:messages };
    } catch (error) {
      this.logger.error(`Get chat messages error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private auth(client: Socket) {
    const cookieHeader = client.request.headers.cookie;

    if (!cookieHeader) {
      throw new WsException('unauthorized');
    }
    const parsedCookies = parse(cookieHeader);

    const token = parsedCookies[CookieNameEnum.Access_token];

    if (!token || !isJWT(token)) {
      throw new WsException('unauthorized');
    }
    return this.validateToken(token);
  }
  private async validateToken(token: string) {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: process.env.ACCESS_TOKEN_SECRET_KEY,
      });
      return payload;
    } catch (error) {
      throw new WsException('Invalid or expired JWT token');
    }
  }
}
