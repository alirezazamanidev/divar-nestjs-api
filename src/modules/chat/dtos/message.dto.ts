import { IsNotEmpty, IsUUID } from "class-validator";

import { IsString } from "class-validator";
export class CreateMessageDto {
    @IsNotEmpty()
    @IsUUID()
    roomId: string;
    @IsNotEmpty()
    @IsUUID()
    senderId: string;
    @IsNotEmpty()
    @IsString()
    message: string;
}
export class SendMessageDto {
    @IsNotEmpty()
    @IsUUID()
    postId: string;
    @IsNotEmpty()
    @IsString()
    message: string;
}