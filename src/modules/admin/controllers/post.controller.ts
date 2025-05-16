import { Body, Controller, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';
import { PostService } from '../services/post.service';
import { ApiOperation } from '@nestjs/swagger';
import { ChangeStatusDto } from '../dto/post.dto';

@Controller('post')
export class PostController {
  constructor(private readonly postService:PostService) {}

  @ApiOperation({summary:'change status'})
  @HttpCode(HttpStatus.OK)
  @Patch('status/:id')
  changeStatus(@Body() dto:ChangeStatusDto,@Param('id') id:string){
    return this.postService.changeStatus(id,dto.status);

  }
}
