import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";


export class SendMessageDto{

    @IsOptional()
    @IsUUID()
    roomId?:string

    @IsOptional()
    @IsUUID()
    postId?:string
    @IsNotEmpty()
    @IsString()
    text:string
    
}