import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { isJWT } from 'class-validator';
import { parse } from 'cookie';
import { Server, Socket } from 'socket.io';
import { JWTPayload } from '../auth/types/payload.type';
import { CreateRoomDto, JoinRoomDto, LeaveRoomDto } from './dtos/chat.dto';
import { SendMessageDto } from './dtos/message.dto';
import { RoomService } from './services/room.service';
import { MessageService } from './services/message.service';
import { da } from '@faker-js/faker';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
})
export class ChatGateway {
  private server: Server;
  private readonly logger: Logger = new Logger(ChatGateway.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly roomService: RoomService,
    private readonly messageService: MessageService,
  ) {}
  afterInit(server: Server) {
    this.server = server;
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    const user = this.authenticate(client);
    client.join(`user_${user.userId}`);
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user as JWTPayload;
    client.leave(`user_${user.userId}`);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private authenticate(client: Socket) {
    const token = parse(client.request.headers.cookie as string)?.[
      'access_token'
    ];

    if (!token || !isJWT(token)) {
      client.disconnect(true);
      this.logger.error('unauthorized');
      return;
    }
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.ACCESS_TOKEN_SECRET_KEY,
      });
      client.data.user = payload as JWTPayload;
      return payload;
    } catch (error) {
      this.logger.error('unauthorized');
      client.disconnect(true);
      return;
    }
  }

  @SubscribeMessage('send.message')
  async onSendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: SendMessageDto,
  ) {
    const { postId,sellerId,buyerId, message } = data;

    const room = await this.roomService.create(postId,sellerId,buyerId);

    const messageData = await this.messageService.createMessage(
      room.id,
      message,
      socket.data.user.userId,
    );

  }
}
