import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CreateRoomDto{
    @IsNotEmpty()
    @IsString()
    @IsUUID()
    postId:string   
}
export class JoinRoomDto{
    @IsNotEmpty()
    @IsString()
    @IsUUID()
    roomId:string
}
export class LeaveRoomDto{
    @IsNotEmpty()
    @IsString()
    @IsUUID()
    roomId:string
}