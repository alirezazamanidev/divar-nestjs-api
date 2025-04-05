import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,

  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChatService } from './services/chat.service';
import { CreateChatRoomDto } from './dtos';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('Chat')

@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('create-room')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new chat room' })
  @ApiResponse({ status: 201, description: 'Chat room created successfully' })
  async createChatRoom(@Body() createChatRoomDto: CreateChatRoomDto, @Req() req:Request) {
    return this.chatService.createChatRoom(createChatRoomDto, req.user.id);
  }

  
} 