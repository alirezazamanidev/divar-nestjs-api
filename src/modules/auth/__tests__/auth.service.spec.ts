import { Test, TestingModule } from '@nestjs/testing';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { Response } from 'express';
import { AuthMessages, ForbiddenMessage, PublicMessage } from 'src/common/enums';
import { AuthService } from '../auth.service';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { TokenService } from '../token.service';

describe('AuthService', () => {
  let service: AuthService;
  let cacheManager: Cache;
  let userRepository: Repository<UserEntity>;
  let tokenService: TokenService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockTokenService = {
    createJwt: jest.fn(),
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  };

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    cacheManager = module.get(CACHE_MANAGER);
    userRepository = module.get(getRepositoryToken(UserEntity));
    tokenService = module.get<TokenService>(TokenService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOtp', () => {
    it('should create a new user if user does not exist', async () => {
      const phone = '09123456789';
      const userId = 'user-id';
      const otpCode = '12345';
      
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ phone });
      mockUserRepository.save.mockResolvedValue({ id: userId, phone, isBlocked: false });
      mockCacheManager.get.mockResolvedValue(null);
      mockCacheManager.set.mockResolvedValue(true);
      
      const createOtpSpy = jest.spyOn(service as any, 'createOtpForUser').mockResolvedValue(otpCode);
      
      const result = await service.sendOtp({ phone });
      
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { phone } });
      expect(mockUserRepository.create).toHaveBeenCalledWith({ phone });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(createOtpSpy).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        message: PublicMessage.SendOtp,
        otpCode,
      });
    });

    it('should use existing user if user exists', async () => {
      const phone = '09123456789';
      const userId = 'user-id';
      const otpCode = '12345';
      const user = { id: userId, phone, isBlocked: false };
      
      mockUserRepository.findOne.mockResolvedValue(user);
      mockCacheManager.get.mockResolvedValue(null);
      
      const createOtpSpy = jest.spyOn(service as any, 'createOtpForUser').mockResolvedValue(otpCode);
      
      const result = await service.sendOtp({ phone });
      
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { phone } });
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(createOtpSpy).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        message: PublicMessage.SendOtp,
        otpCode,
      });
    });

    it('should throw ForbiddenException if user is blocked', async () => {
      const phone = '09123456789';
      const user = { id: 'user-id', phone, isBlocked: true };
      
      mockUserRepository.findOne.mockResolvedValue(user);
      
      await expect(service.sendOtp({ phone })).rejects.toThrow(ForbiddenException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { phone } });
    });
  });

  describe('checkOtp', () => {
    it('should validate OTP and set cookies on success', async () => {
      const phone = '09123456789';
      const code = '12345';
      const userId = 'user-id';
      const user = { id: userId, phone, phone_verify: false };
      const tokens = { access_token: 'access-token', refresh_token: 'refresh-token' };
      
      mockUserRepository.findOne.mockResolvedValue(user);
      mockCacheManager.get.mockResolvedValue(code);
      mockUserRepository.save.mockResolvedValue({ ...user, phone_verify: true });
      mockTokenService.createJwt.mockResolvedValue(tokens);
      mockCacheManager.set.mockResolvedValue(true);
      
      await service.checkOtp({ phone, code }, mockResponse);
      
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { phone } });
      expect(mockCacheManager.get).toHaveBeenCalledWith(`otp:${userId}`);
      expect(mockUserRepository.save).toHaveBeenCalledWith({ ...user, phone_verify: true });
      expect(mockTokenService.createJwt).toHaveBeenCalledWith(userId);
      expect(mockCacheManager.set).toHaveBeenCalledWith(`rt:${userId}`, tokens.refresh_token);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: PublicMessage.LoggedIn });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      
      await expect(service.checkOtp({ phone: '09123456789', code: '12345' }, mockResponse))
        .rejects.toThrow(new UnauthorizedException(AuthMessages.LoginAgain));
    });

    it('should throw UnauthorizedException if OTP expired', async () => {
      const user = { id: 'user-id', phone: '09123456789' };
      mockUserRepository.findOne.mockResolvedValue(user);
      mockCacheManager.get.mockResolvedValue(null);
      
      await expect(service.checkOtp({ phone: '09123456789', code: '12345' }, mockResponse))
        .rejects.toThrow(new UnauthorizedException(AuthMessages.OtpExpired));
    });

    it('should throw UnauthorizedException if OTP is incorrect', async () => {
      const user = { id: 'user-id', phone: '09123456789' };
      mockUserRepository.findOne.mockResolvedValue(user);
      mockCacheManager.get.mockResolvedValue('54321'); // Different from input code
      
      await expect(service.checkOtp({ phone: '09123456789', code: '12345' }, mockResponse))
        .rejects.toThrow(new UnauthorizedException(AuthMessages.OtpINCorrect));
    });
  });

  describe('logout', () => {
    it('should clear refresh token and cookies', async () => {
      const userId = 'user-id';
      
      mockCacheManager.del.mockResolvedValue(undefined);
      mockUserRepository.update.mockResolvedValue(undefined);
      
      await service.logout(userId, mockResponse);
      
      expect(mockCacheManager.del).toHaveBeenCalledWith(`rt:${userId}`);
      expect(mockUserRepository.update).toHaveBeenCalledWith({ id: userId }, { phone_verify: false });
      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: PublicMessage.LoggedOut });
    });
  });

  describe('validateAccessToken', () => {
    it('should return user if token is valid', async () => {
      const token = 'valid-token';
      const userId = 'user-id';
      const user = { id: userId, username: 'testuser' };
      
      mockTokenService.verifyAccessToken.mockReturnValue({ userId });
      mockUserRepository.findOne.mockResolvedValue(user);
      
      const result = await service.validateAccessToken(token);
      
      expect(mockTokenService.verifyAccessToken).toHaveBeenCalledWith(token);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.any(Object)
      });
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const token = 'valid-token';
      const userId = 'user-id';
      
      mockTokenService.verifyAccessToken.mockReturnValue({ userId });
      mockUserRepository.findOne.mockResolvedValue(null);
      
      await expect(service.validateAccessToken(token))
        .rejects.toThrow(new UnauthorizedException(AuthMessages.LoginAgain));
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens if refresh token is valid', async () => {
      const refreshToken = 'valid-refresh-token';
      const userId = 'user-id';
      const user = { id: userId };
      const tokens = { access_token: 'new-access-token', refresh_token: 'new-refresh-token' };
      
      mockTokenService.verifyRefreshToken.mockReturnValue({ userId });
      mockCacheManager.get.mockResolvedValue(refreshToken);
      mockUserRepository.findOne.mockResolvedValue(user);
      mockCacheManager.del.mockResolvedValue(undefined);
      mockTokenService.createJwt.mockResolvedValue(tokens);
      mockCacheManager.set.mockResolvedValue(true);
      
      await service.refreshToken(refreshToken, mockResponse);
      
      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockCacheManager.get).toHaveBeenCalledWith(`rt:${userId}`);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockCacheManager.del).toHaveBeenCalledWith(`rt:${userId}`);
      expect(mockTokenService.createJwt).toHaveBeenCalledWith(userId);
      expect(mockCacheManager.set).toHaveBeenCalledWith(`rt:${userId}`, tokens.refresh_token);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      const invalidToken = 'invalid-token';
      
      mockTokenService.verifyRefreshToken.mockImplementation(() => {
        throw new UnauthorizedException();
      });
      
      await expect(service.refreshToken(invalidToken, mockResponse))
        .rejects.toThrow(UnauthorizedException);
      
      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(invalidToken);
    });

    it('should throw UnauthorizedException if cached token does not match', async () => {
      const refreshToken = 'valid-refresh-token';
      const userId = 'user-id';
      
      mockTokenService.verifyRefreshToken.mockReturnValue({ userId });
      mockCacheManager.get.mockResolvedValue('different-token');
      
      await expect(service.refreshToken(refreshToken, mockResponse))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const refreshToken = 'valid-refresh-token';
      const userId = 'user-id';
      
      mockTokenService.verifyRefreshToken.mockReturnValue({ userId });
      mockCacheManager.get.mockResolvedValue(refreshToken);
      mockUserRepository.findOne.mockResolvedValue(null);
      
      await expect(service.refreshToken(refreshToken, mockResponse))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});
