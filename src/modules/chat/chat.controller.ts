import { Controller, Get, Param, Req } from "@nestjs/common";
import { Auth } from "../auth/decorators";
import { ChatService } from "./services/chat.service";
import { Request } from "express";

@Auth()
@Controller('chat')
export class ChatController{

    constructor(private readonly chatService:ChatService){}

    @Get('/check-exist/:postId')
    checkExist(@Param('postId') postId:string,@Req() req:Request){
        console.log(postId);
        
        return this.chatService.checkExist(req.user.id,postId)

    }
}