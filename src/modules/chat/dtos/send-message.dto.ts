import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  @IsUUID()
  chatRoomId: string;

  @IsNotEmpty()
  @IsString()
  message: string;
} 