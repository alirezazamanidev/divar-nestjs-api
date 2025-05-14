import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UploadFileS3 } from 'src/common/interceptors/upload-file.interceptor';
import { ContentType } from 'src/common/enums';
import { CreateCategoryDto } from '../dto/category.dto';

@ApiTags('Category(AdminPanel)')
@Controller('category')
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
}
