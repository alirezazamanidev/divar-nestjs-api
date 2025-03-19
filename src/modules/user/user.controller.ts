import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/decorators';
import { UpdateProfileDto, UploadAvatarDTo } from './dto/user.dto';
import { ContentType } from 'src/common/enums';

@Auth()
@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}


  @Post('update-profile')
  @ApiOperation({
    summary: 'بروزرسانی پروفایل کاربر',
    description:
      'این اندپوینت اطلاعات پروفایل کاربر احراز هویت شده را بروزرسانی می‌کند',
  })
  @ApiConsumes(ContentType.UrlEncoded, ContentType.Json)
  async updateProfile(@Body() updateProfileDto: UpdateProfileDto) {
    return this.userService.updateProfile(updateProfileDto);
  }

  // @Post('upload-avatar')
  // @ApiOperation({
  //   summary: 'آپلود تصویر پروفایل',
  //   description:
  //     'این اندپوینت برای آپلود تصویر پروفایل کاربر احراز هویت شده استفاده می‌شود',
  // })
  // @ApiConsumes(ContentType.Multipart)
  // @ApiBody({ type: UploadAvatarDTo })
  // @UseInterceptors(UploadFile('avatar', 'user'))
  // async uploadAvatar(
  //   @UploadedFile(
  //     new FileValidationPipe({
  //       required: true,
  //       allowedTypes: ['jpg', 'jpeg', 'png', 'webp'],
  //       maxSize: 2 * 1024 * 1024, // 2MB
  //     }),
  //   )
  //   file: Express.Multer.File,
  // ) {
  //   return this.userService.uploadAvatar(file);
  // }
}
