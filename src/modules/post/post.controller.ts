import { Controller, UseInterceptors, Post, Body, UploadedFiles, Get, Param, Query } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dtos/post.dto';
import { Auth } from '../auth/decorators';
import { ApiConsumes, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ContentType } from 'src/common/enums';
import { DEFAULT_MEDIA_OPTIONS, UploadFileFieildsS3 } from 'src/common/interceptors/upload-file.interceptor';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}
  
  @Get('create')
  @ApiQuery({name:'slug',type:String,required:false})
  createPostPage(@Query('slug') slug:string){
    return this.postService.createPostPage(slug);
  }
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

  @ApiOperation({summary:'GET one by id'})
  @Get('get-one/:id')
  getOne(@Param('id') id:string){
    return this.postService.getOne(id);
  }


}
