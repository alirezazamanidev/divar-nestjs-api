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
import { JoinRoomDto } from './dto/room.dto';
import { SendMessageDto } from './dto/message.dto';
import { MessageService } from './services/message.service';

@UseFilters(new WsAllExceptionsFilter())
@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
    private jwtService: JwtService,
  ) {}
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  validateTokenFromCookies(client: Socket) {
    const rawCookie = client.handshake.headers.cookie;
    if (!rawCookie) throw new UnauthorizedException(AuthMessages.LoginAgain);
    const cookies = parse(rawCookie);
    const token = cookies[CookieNameEnum.Access_token];
    if (!token) throw new UnauthorizedException(AuthMessages.LoginAgain);
    try {
      return this.jwtService.verify(token, {
        secret: process.env.ACCESS_TOKEN_SECRET_KEY,
      });
    } catch (error) {
      client.disconnect();
      throw new UnauthorizedException(AuthMessages.LoginAgain);
    }
  }
  afterInit() {
    this.logger.log('🔌 WebSocket Chat Gateway Initialized');
  }

  async handleConnection(client: Socket) {
    const payload = this.validateTokenFromCookies(client);
    client.data.user = payload;
    this.logger.log(`✅ Client connected: ${client.id}`);
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
    const recentMessages=await this.messageService.recentMessages(room.id);
    client.join(`room_${room.id}`);
    this.server.to(`room_${room.id}`).emit('messages',recentMessages);
    this.logger.log(`Client ${client.id} joined room ${room.id}`);
  }
  @SubscribeMessage('send.message')
  async onSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const { userId } = client.data.user;
    let chatId = dto.roomId ?? null;

    if (!chatId && dto.postId) {
      const room = await this.chatService.createRoom(userId, dto.postId);
      chatId = room.id;
      // join to room
      client.join(`room_${chatId}`);
    }
    const message = await this.messageService.create(
      dto.text,
      chatId!,
      client.data.user.userId,
    );

    this.server.to(`room_${chatId}`).emit('newMessage', message);
  }
}
