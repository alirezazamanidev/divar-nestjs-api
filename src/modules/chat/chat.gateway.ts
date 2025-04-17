import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { isJWT } from 'class-validator';
import { parse } from 'cookie';
import { Server, Socket } from 'socket.io';
import { JWTPayload } from '../auth/types/payload.type';
import { CreateRoomDto } from './dtos/create-chat.dto';
import { SendMessageDto } from './dtos/send-message.dto';
import { ChatService } from './services/chat.service';
import { MessageService } from './services/message.service';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: 'http://localhost:3000',
    credentials: true
  },
  pingInterval: 10000,
  pingTimeout: 5000
})
export class ChatGateway {
  private server: Server;
  private readonly logger: Logger = new Logger(ChatGateway.name)
  constructor(private readonly jwtService:JwtService,private readonly chatService:ChatService,private readonly messageService:MessageService){}
  afterInit(server: Server) {
    this.server = server;
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    const user= this.authenticate(client);
    client.join(`user_${user.userId}`);
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const user=client.data.user as JWTPayload;
    client.leave(`user_${user.userId}`);
    this.logger.log(`Client disconnected: ${client.id}`);
  }


  



  @SubscribeMessage('sendMessage')
  async sendMessage(@ConnectedSocket() client:Socket,@MessageBody() data:SendMessageDto){
    const user=client.data.user as JWTPayload;
    const room= await this.chatService.createRoom({postId:data.postId},user.userId);
    const message= await this.messageService.createMessage({
      roomId:room.id,
      senderId:user.userId,
      message:data.message
    })
    this.server.to(room.id).emit('newMessage',message);
    // send notification to receiver
    
    this.notification(client,room.receiverId,{type:'newMessage',data:message})
  }


  private notification(client:Socket,receiverId:string,option:{type:string,data:any}){
    client.to(`user_${receiverId}`).emit('notification',option)
  }

  private authenticate(client:Socket){
    const token= parse(client.request.headers.cookie as string)?.['access_token']
    
    if(!token || !isJWT(token)){
      client.disconnect(true)
      this.logger.error('unauthorized')
     return;
    }
    try{
      const payload=this.jwtService.verify(token,{secret:process.env.ACCESS_TOKEN_SECRET_KEY})
      client.data.user=payload as JWTPayload;
      return payload;
    }catch(error){
      this.logger.error('unauthorized')
      client.disconnect(true)
      return;
    }
  }
}
