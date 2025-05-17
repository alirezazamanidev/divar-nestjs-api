import { IsNotEmpty, IsUUID } from "class-validator";

export class JoinRoomDto {
    @IsNotEmpty()
    @IsUUID()
    roomId:string
}