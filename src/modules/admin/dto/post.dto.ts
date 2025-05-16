import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";
import { StatusEnum } from "src/common/enums";

export class ChangeStatusDto{
    @ApiProperty({enum:StatusEnum})
    @IsNotEmpty()
    @IsEnum(StatusEnum)
    status:string
}