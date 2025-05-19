import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ChatService } from './services/chat.service';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException, UseFilters } from '@nestjs/common';
import { WsAllExceptionsFilter } from 'src/common/filters/all-ws-exceptions.filter';
import { parse } from 'cookie';
import { AuthMessages, CookieNameEnum } from 'src/common/enums';
import { JwtService } from '@nestjs/jwt';
import { CheckExistRoomDto, JoinRoomDto, leaveRoomDto } from './dto/room.dto';
import { SendMessageDto } from './dto/message.dto';
import { MessageService } from './services/message.service';
import { TokenService } from '../auth/token.service';

// @UseFilters(new WsAllExceptionsFilter())
@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly logger:Logger=new Logger(ChatGateway.name);

  
  constructor(
    private readonly chatService:ChatService,
    private readonly messageService:MessageService,
    private readonly jwtService:JwtService
  ){}
  async handleConnection(client: Socket) {
    const payload = this.validateTokenFromCookies(client);
    
    client.data.user = payload;
    this.logger.log(`✅ Client connected: ${client.id}`);
    client.join(`user_${payload.userId}`)

    // get all chats
    const rooms = await this.chatService.findAllForUser(payload.userId);
    client.emit('get-chats', rooms);
  }
  handleDisconnect(client: Socket) {
    this.logger.log(`❌ Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async onJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinRoomDto,
  ) {
    const room = await this.chatService.findOneById(dto.roomId);
    await this.messageService.markMessageAsSeen(room.id,client.data.user.userId)
    const recentMessages=await this.messageService.recentMessages(room.id);
    client.join(`room_${room.id}`);
    this.server.to(`room_${room.id}`).emit('messages',recentMessages);
    this.logger.log(`Client ${client.id} joined room ${room.id}`);
  }
  @SubscribeMessage('leaveRoom')
  onLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: leaveRoomDto,
  ){

    client.leave(`room_${dto.roomId}`);

    this.logger.log(`🚪 Client ${client.id} has left room ${dto.roomId} !`);
    
  }
  @SubscribeMessage('send.message')
  async onSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const { userId } = client.data.user;
    let chatId = dto.roomId ?? null;
    let isNewRoom = false;
    let seen=false
    if (!chatId && dto.postId) {
      const room = await this.chatService.createRoom(userId, dto.postId);
      chatId = room.id;
      isNewRoom = true;
      // join to room
      client.join(`room_${chatId}`);
    }

    const message = await this.messageService.create(
      dto.text,
      chatId!,
      client.data.user.userId,
    );

    // Update last message and emit to all users in the chat
    this.server.to(`room_${chatId}`).emit('newMessage', message);
    
    if (isNewRoom) {
      const updatedChat = await this.chatService.findOneChat(chatId!);
      this.server.to(`user_${userId}`).emit('add-chat', updatedChat);
      this.server.to(`user_${updatedChat.sellerId}`).emit('add-chat', updatedChat);
    }

    return chatId;
  }

  @SubscribeMessage('typing')
  onTyping(
    @ConnectedSocket() client:Socket,
    @MessageBody() dto:{roomId:string}
  ){
   
    client.broadcast.to(`room_${dto.roomId}`).emit(`isTyping`,{
      userId:client.data.user.userId
    })
  }

  validateTokenFromCookies(client: Socket) {
    const rawCookie = client.handshake.headers.cookie;
    if (!rawCookie) throw new UnauthorizedException(AuthMessages.LoginAgain);
    const cookies = parse(rawCookie);
    const token = cookies[CookieNameEnum.Access_token];
    if (!token) throw new UnauthorizedException(AuthMessages.LoginAgain);

    try {

      return this.jwtService.verify(token,{secret:process.env.ACCESS_TOKEN_SECRET_KEY});
    } catch (error) {
      client.disconnect();
      console.log(error);
      
      throw new UnauthorizedException(AuthMessages.LoginAgain);
    }
  }
}
