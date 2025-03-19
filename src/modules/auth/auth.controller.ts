import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { CheckOtpDto, SendOtpDto } from './dtos/auth.dto';
import { ContentType } from 'src/common/enums';
import { Request, Response } from 'express';
import { Auth } from './decorators';
import { CurrentUser } from 'src/common/decorators/currentUser.decorator';
import { CookieNameEnum } from 'src/common/enums';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  @ApiOperation({summary:'send otp'})
  @HttpCode(HttpStatus.OK)
  @ApiConsumes(ContentType.UrlEncoded,ContentType.Json)
  @Post('send-otp')
  sendOtp(@Body() userDto:SendOtpDto){
    return this.authService.sendOtp(userDto)
  }
  @ApiOperation({summary:'check otp'})
  @HttpCode(HttpStatus.OK)
  @ApiConsumes(ContentType.UrlEncoded,ContentType.Json)
  @Post('check-otp')
  checkOtp(@Body() userDto:CheckOtpDto,@Res() res:Response){
    return this.authService.checkOtp(userDto,res)
  }
  @ApiOperation({summary:'Logout user'})
  @Auth()
  @HttpCode(HttpStatus.OK)
  @Get('logout')
  logout(@CurrentUser('id') userId: string, @Res() res: Response) {
    return this.authService.logout(userId, res);
  }
  @ApiOperation({summary:'Get user payload'})
  @Auth()
  @HttpCode(HttpStatus.OK)
  @Get('/check-login')
  checkLogin(@Req() req:Request){
    return {
      user:req.user
    }

  }
  @ApiOperation({summary:'Refresh token'})
  @HttpCode(HttpStatus.OK)
  @Get('refresh')
  refreshToken(@Req() req: Request, @Res() res: Response) {
    const refresh_token = req.cookies[CookieNameEnum.Refresh_token];
    return this.authService.refreshToken(refresh_token, res);
  }

 
}
