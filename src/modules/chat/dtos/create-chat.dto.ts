import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CreateRoomDto{
    @IsNotEmpty()
    @IsString()
    @IsUUID()
    postId:string   
}