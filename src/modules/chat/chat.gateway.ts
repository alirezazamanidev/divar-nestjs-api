import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException, UseFilters } from '@nestjs/common';
import { WsAllExceptionsFilter } from 'src/common/filters/all-ws-exceptions.filter';
import { parse } from 'cookie';
import { AuthMessages, CookieNameEnum } from 'src/common/enums';
import { JwtService } from '@nestjs/jwt';
import { JoinRoomDto } from './dto/room.dto';

@UseFilters(new WsAllExceptionsFilter())
@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService,private jwtService:JwtService) {}
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  validateTokenFromCookies(client:Socket){
    const rawCookie=client.handshake.headers.cookie;
    if(!rawCookie) throw new UnauthorizedException(AuthMessages.LoginAgain);
    const cookies=parse(rawCookie);
    const token=cookies[CookieNameEnum.Access_token];
    if(!token) throw new UnauthorizedException(AuthMessages.LoginAgain)    
    try {
      return this.jwtService.verify(token,{secret:process.env.ACCESS_TOKEN_SECRET_KEY})
    } catch (error) {
      client.disconnect();
      throw new UnauthorizedException(AuthMessages.LoginAgain);
    }
  }
  afterInit() {
    this.logger.log('🔌 WebSocket Chat Gateway Initialized');
  }

  handleConnection(client: Socket) {
    
    const payload=this.validateTokenFromCookies(client);
    client.data.user=payload;
    this.logger.log(`✅ Client connected: ${client.id}`);
  }
  handleDisconnect(client: Socket) {
    this.logger.log(`❌ Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async onJoinRoom(
    @ConnectedSocket() client:Socket,
    @MessageBody() dto:JoinRoomDto
  ){
    const room=await this.chatService.findOneById(dto.roomId);

    client.join(`room_${room.id}`)
    this.logger.log(`Client ${client.id} joined room ${room.id}`);

  }
}
