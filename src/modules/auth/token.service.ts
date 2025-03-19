import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Tokens } from './types/tokens.type';
import { JWTPayload } from './types/payload.type';
import { AuthMessages } from 'src/common/enums/messages.enum';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async createJwt(userId: string): Promise<Tokens> {
    const [at, rt] = await Promise.all([
      this.jwtService.sign(
        { userId },
        { secret: process.env.ACCESS_TOKEN_SECRET_KEY, expiresIn: '5d' },
      ),
      this.jwtService.sign(
        { userId },
        { secret: process.env.REFRESH_TOKEN_SECRET_KEY, expiresIn: '7d' },
      ),
    ]);
    return {
      access_token: at,
      refresh_token: rt,
    };
  }

   verifyAccessToken(at: string):JWTPayload {
    try {
      return this.jwtService.verify(at, {
        secret: process.env.ACCESS_TOKEN_SECRET_KEY,
      });
    } catch (error) {
      throw new UnauthorizedException(AuthMessages.LoginAgain);
    }
  }
  verifyRefreshToken(rt: string):JWTPayload {
    try {
      return this.jwtService.verify(rt, {
        secret: process.env.REFRESH_TOKEN_SECRET_KEY,
      });
    } catch (error) {
      throw new UnauthorizedException(AuthMessages.LoginAgain);
    }
  }
}
