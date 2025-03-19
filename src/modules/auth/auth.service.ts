import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CheckOtpDto, SendOtpDto } from './dtos/auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AuthMessages, CookieNameEnum, ForbiddenMessage, PublicMessage } from 'src/common/enums';
import { randomInt } from 'crypto';
import { TokenService } from './token.service';
import { Response } from 'express';
import { Tokens } from './types/tokens.type';
import { isJWT } from 'class-validator';

@Injectable()
export class AuthService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly tokenService: TokenService,
  ) {}
  async sendOtp(userDto: SendOtpDto) {
    
    const { phone } = userDto;
    
    let user = await this.userRepo.findOne({ where: { phone } });
    if (!user) user = await this.createFirstUser(phone);
    // check user blocked
    if(user.isBlocked) throw new ForbiddenException(ForbiddenMessage.UserBlocked)
      // create and send otp with sms service
    const otpCode = await this.createOtpForUser(user.id);
    return {
      message: PublicMessage.SendOtp,
      otpCode,
    };
  }
  async checkOtp(userDto: CheckOtpDto, res: Response) {
    const { phone, code } = userDto;
    const user = await this.userRepo.findOne({ where: { phone } });
    if (!user) throw new UnauthorizedException(AuthMessages.LoginAgain);
    const otpCode = await this.cacheManager.get(`otp:${user.id}`);
    if (!otpCode) throw new UnauthorizedException(AuthMessages.OtpExpired);
    if (otpCode !== code)
      throw new UnauthorizedException(AuthMessages.OtpINCorrect);
    if (!user.phone_verify) user.phone_verify = true;
    await this.userRepo.save(user)
    // create jwt tokens (refresh token ,access Toekn)
    const tokens = await this.tokenService.createJwt(user.id);
    await this.cacheManager.set(`rt:${user.id}`, tokens.refresh_token);
    // set ccookie
    this.setJwtCookie(res, tokens);
  }
  async logout(userId: string, res: Response) {
    // Remove refresh token from cache
    await this.cacheManager.del(`rt:${userId}`);
    await this.userRepo.update({id:userId},{phone_verify:false});

    // Clear cookies
    res
      .clearCookie(CookieNameEnum.Access_token, {
        httpOnly: process.env.NODE_ENV === 'production',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        domain: 'localhost',
      })
      .clearCookie(CookieNameEnum.Refresh_token, {
        httpOnly: process.env.NODE_ENV === 'production',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        domain: 'localhost',
      })
      // update phone verify
      .json({
        message: PublicMessage.LoggedOut
      });
  }

  async validateAccessToken(token: string):Promise<UserEntity> {
    const { userId } = this.tokenService.verifyAccessToken(token);
    
    const user = await this.userRepo.findOne({
      where: {
        id: userId,
      },
      relations:['wallet'],
      select: {
        id: true,
        username: true,
        roles:true,
        isBlocked:true,
        fullname: true,
    
        email: true,
        phone: true,
        phone_verify: true,
        email_verify: true,
        created_at: true,
       
        bio:true,
        updated_at: true,
      },
    });
    if(!user) throw new UnauthorizedException(AuthMessages.LoginAgain);

    return user;
  }

  async refreshToken(refresh_token: string, res: Response) {
    if (!refresh_token && !isJWT(refresh_token)) {
      throw new UnauthorizedException(AuthMessages.LoginAgain);
    }

    // verify refresh token
    const { userId } = this.tokenService.verifyRefreshToken(refresh_token);
    
    // check if refresh token exists in cache
    const cachedRefreshToken = await this.cacheManager.get(`rt:${userId}`);
    if (!cachedRefreshToken || cachedRefreshToken !== refresh_token) {
      throw new UnauthorizedException(AuthMessages.LoginAgain);
    }

    // get user
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(AuthMessages.LoginAgain);
    }

    // delete old refresh token
    await this.cacheManager.del(`rt:${userId}`);

    // create new tokens
    const tokens = await this.tokenService.createJwt(userId);
    
    // save new refresh token in cache
    await this.cacheManager.set(`rt:${userId}`, tokens.refresh_token);

    // set new cookies
    this.setJwtCookie(res, tokens);
  }

  // private methods
  private setJwtCookie(res: Response, tokens: Tokens) {
    const { access_token, refresh_token } = tokens;
    res
      .status(200)
      .cookie(CookieNameEnum.Access_token, access_token, {
        maxAge: 1000 * 60 * 60*24*5,
        httpOnly:true,
        secure:true,
        path: '/',
        domain: 'localhost',
      })
      .cookie(CookieNameEnum.Refresh_token, refresh_token, {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly:true,
        secure: true,
        path: '/',
        domain: 'localhost',
      })
      .json({
        message: PublicMessage.LoggedIn,
      });
  }
  private async createOtpForUser(userId: string) {
    let otp = await this.cacheManager.get(`otp:${userId}`);
    if (otp) throw new UnauthorizedException(AuthMessages.OtpNotExpired);
    const code = randomInt(10000, 99999).toString();
    await this.cacheManager.set(
      `otp:${userId}`,
      code,
      process.env.OTP_TIME_EXPIRED,
    );
    return code;
  }
  private async createFirstUser(phone: string) {
    let user = this.userRepo.create({ phone });
    user = await this.userRepo.save(user);
    return user;
  }
}
