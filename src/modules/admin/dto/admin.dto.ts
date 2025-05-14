import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class LoginDto{
    @ApiProperty()
    @IsString()
    @Length(8,20)
    password:string;
}