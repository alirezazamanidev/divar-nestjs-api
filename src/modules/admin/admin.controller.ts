import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/decorators';
import { LoginDto } from './dto/admin.dto';
import { AdminService } from './admIn.service';
import { Response } from 'express';
import { ContentType } from 'src/common/enums';

@ApiTags('Admin')
@Controller('/')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: 'login admin panel' })
  @Auth()
  @ApiConsumes(ContentType.UrlEncoded)
  @Post('login')
  login(@Body() loginDto: LoginDto, @Res() res: Response) {
    return this.adminService.login(loginDto, res);
  }
}
