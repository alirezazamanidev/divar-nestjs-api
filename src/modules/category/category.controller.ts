import {
  Controller,
  Get,
  Query,

} from '@nestjs/common';

import { CategoryService } from './category.service';

import { ApiQuery } from '@nestjs/swagger';

@Controller('')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}
  @Get('list')
  @ApiQuery({name:'slug',required:false})
  listCategories(@Query('slug') slug:string){

    return this.categoryService.listCategories(slug)
  }
}
