
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsPhoneNumber, IsString, MinLength, Matches, IsMobilePhone } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ 
    required: false, 
    description: 'نام کاربری - حداقل ۳ کاراکتر' 
  })
  @IsOptional()
  @IsString({ message: 'نام کاربری باید رشته متنی باشد' })
  @MinLength(3, { message: 'نام کاربری باید حداقل ۳ کاراکتر داشته باشد' })
  @Matches(/^[a-zA-Z0-9._-]+$/, { message: 'نام کاربری فقط می‌تواند شامل حروف، اعداد و کاراکترهای . _ - باشد' })
  username?: string;

  @ApiProperty({ 
    required: false, 
    description: 'آدرس ایمیل معتبر' 
  })
  @IsOptional()
  @IsEmail({}, { message: 'لطفا یک آدرس ایمیل معتبر وارد کنید' })
  email?: string;

  @ApiProperty({ 
    required: false, 
    description: 'نام کامل کاربر - حداقل ۳ کاراکتر' 
  })
  @IsOptional()
  @IsString({ message: 'نام کامل باید رشته متنی باشد' })
  @MinLength(3, { message: 'نام کامل باید حداقل ۳ کاراکتر داشته باشد' })
  fullname?: string;

  @ApiProperty({
    required: false,
    description: 'بیوگرافی کاربر'
  })
  @IsOptional()
  @IsString({ message: 'بیوگرافی باید رشته متنی باشد' })
  bio?: string;

}
export class UploadAvatarDTo{
    @ApiProperty({type:'string',format:'binary'})
    avatar:Express.Multer.File
}

