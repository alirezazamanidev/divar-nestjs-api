import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UploadFileS3 } from 'src/common/interceptors/upload-file.interceptor';
import { ApiConsumes, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ContentType } from 'src/common/enums';

@Controller('')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiOperation({ summary: 'create new category' })
  @Post('create')
  @UseInterceptors(UploadFileS3('icon'))
  @ApiConsumes(ContentType.Multipart)
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      createCategoryDto['icon'] = file;
    }

    return this.categoryService.create(createCategoryDto);
  }

  @Get('list')
  @ApiQuery({name:'slug',required:false})
  listCategories(@Query('slug') slug:string){

    return this.categoryService.listCategories(slug)
  }

  
}
