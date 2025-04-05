import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { CookieNameEnum } from 'src/common/enums';
import { WsException } from '@nestjs/websockets';
import { parse } from 'cookie';
import { isJWT } from 'class-validator';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const socket: Socket = context.switchToWs().getClient<Socket>();
    const token = this.extractCookie(socket);
    return this.validateToken(token, socket);
  }

  /**
   * Extracts cookies from the socket request headers.
   * @param socket - The WebSocket client
   * @returns An object with cookie key-value pairs
   */
  private extractCookie(socket: Socket): string {
    const cookieHeader = socket.request.headers.cookie;
    if (!cookieHeader) {
      throw new WsException('unauthorized');
    }
    const parsedCookies = parse(cookieHeader);
    const token = parsedCookies[CookieNameEnum.Access_token];
    if (!token || !isJWT(token)) {
      throw new WsException('unauthorized');
    }
    return token;
  }

  /**
   * Validates the JWT token and attaches user info to the socket.
   * @param token - The JWT token from the cookie
   * @param socket - The WebSocket client
   * @returns Whether the token is valid
   */
  private async validateToken(token: string, socket: Socket): Promise<boolean> {
    try {
      const payload = await this.jwtService.verify(token);
      socket.data.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired JWT token');
    }
  }
}
