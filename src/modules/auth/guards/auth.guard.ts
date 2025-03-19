import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import { isJWT } from 'class-validator';
import { AuthMessages, CookieNameEnum, ForbiddenMessage } from 'src/common/enums';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    
    if (req && req?.cookies) {
       
        
      const access_token = req.cookies?.[CookieNameEnum.Access_token];
      if (!access_token)
        throw new UnauthorizedException(AuthMessages.LoginAgain);
      if (!isJWT(access_token))
        throw new UnauthorizedException(AuthMessages.LoginAgain);
      const user = await this.authService.validateAccessToken(access_token);
      if (user.isBlocked)
        throw new ForbiddenException(ForbiddenMessage.UserBlocked);
      req.user = user;

      return true;
    }
    return false;
  }
}
