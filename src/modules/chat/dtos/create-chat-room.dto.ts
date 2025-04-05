import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateChatRoomDto {
  @IsNotEmpty()
  @IsUUID()
  postId: string;
  @IsNotEmpty()
  @IsString()
  message:string
} 