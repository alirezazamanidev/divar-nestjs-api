import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class ChargeWalletDto {
    @ApiProperty({ description: 'مبلغ شارژ' })
    @IsNumber()
    amount: number;
}