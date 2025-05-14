import { ForbiddenException, Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';
import { LoginDto } from './dto/admin.dto';
import { Roles } from 'src/common/enums';

@Injectable({ scope: Scope.REQUEST })
export class AdminService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  async login(logindto: LoginDto,res:Response) {
    const { password } = logindto;
    const user = this.request.user;
    if (user.role === Roles.User || password !== process.env.ADMIN_PASSEWORD)
      throw new ForbiddenException('access denid');

    // set admin cookie
    res.cookie('isAdmin','true',{
        httpOnly:true,
        maxAge:3800000,
        path:'/',
        sameSite:'lax',
        
    }).status(200).json({
        message:'loggedIn successFully!'
    })
  }
}
