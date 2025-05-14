import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../../auth/decorators';
import { UpdateProfileDto, UploadAvatarDTo } from '../dto/user.dto';
import { ContentType } from 'src/common/enums';
import { ProfileService } from '../services/profile.service';

@Auth()
@ApiTags('User')
@Controller('')
export class ProfileController {
  constructor(private readonly profileService:ProfileService) {}

  @Post('update-profile')
  @ApiOperation({
    summary: 'بروزرسانی پروفایل کاربر',
    description:
      'این اندپوینت اطلاعات پروفایل کاربر احراز هویت شده را بروزرسانی می‌کند',
  })
  @ApiConsumes(ContentType.UrlEncoded, ContentType.Json)
  async updateProfile(@Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.updateProfile(updateProfileDto);
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
