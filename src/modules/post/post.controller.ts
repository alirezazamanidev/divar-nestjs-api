import { Controller, UseInterceptors, Post, Body, UploadedFiles } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dtos/post.dto';
import { Auth } from '../auth/decorators';
import { ApiConsumes } from '@nestjs/swagger';
import { ContentType } from 'src/common/enums';
import { DEFAULT_MEDIA_OPTIONS, UploadFileFieildsS3 } from 'src/common/interceptors/upload-file.interceptor';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}
  @Auth()
  @Post('create')
  @UseInterceptors(UploadFileFieildsS3([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 5 }
  ], DEFAULT_MEDIA_OPTIONS))
  @ApiConsumes(ContentType.Multipart)
  async createPost(
    @Body() postDto: CreatePostDto,
    @UploadedFiles() files: { 
      images?: Express.Multer.File[], 
      videos?: Express.Multer.File[] 
    }
  ) {
    // Combine all media files
    const mediaFiles = [
      ...(files.images || []),
      ...(files.videos || [])
    ];
    
    return this.postService.createPost(postDto, mediaFiles);
  }
}
