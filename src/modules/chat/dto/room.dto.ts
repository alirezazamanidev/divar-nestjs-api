import { IsNotEmpty, IsUUID } from "class-validator";

export class JoinRoomDto {
    @IsNotEmpty()
    @IsUUID()
    roomId:string
}


export class CheckExistRoomDto {
    @IsNotEmpty()
    @IsUUID()
    postId:string
}