import { ApiProperty } from '@nestjs/swagger';
import {
  IsMobilePhone,
  IsNotEmpty,
  IsNumberString,
  IsString,
  Length,
} from 'class-validator';

export class SendOtpDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsMobilePhone('fa-IR')
  phone: string;
}

export class CheckOtpDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsMobilePhone('fa-IR')
  phone: string;
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  @Length(5, 5)
  code: string;
}
