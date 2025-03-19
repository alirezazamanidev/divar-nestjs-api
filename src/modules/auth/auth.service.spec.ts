import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { TokenService } from './token.service';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Cache } from '@nestjs/cache-manager';

describe('AuthService', () => {
  let service: AuthService;
  let cacheManager: Cache;
  let userRepository: Repository<UserEntity>;
  let tokenService: TokenService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTokenService = {
    createJwt: jest.fn(),
    verifyAccessToken: jest.fn(),
  };

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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // نمونه تست برای متد sendOtp
  describe('sendOtp', () => {
    it('should send OTP for existing user', async () => {
      const mockUser = {
        id: '1',
        phone: '09123456789',
        isBlocked: false,
      };
      
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      
      const result = await service.sendOtp({ phone: '09123456789' });
      
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('otpCode');
    });
    it('should create a new user and send OTP when user does not exist', async () => {
      const mockUser = {
        id: '1',
        phone: '09123456789',
        isBlocked: false,
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ phone: '09123456789' });
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.sendOtp({ phone: '09123456789' });

      expect(mockUserRepository.create).toHaveBeenCalledWith({ phone: '09123456789' });
      expect(mockUserRepository.save).toHaveBeenCalledWith({ phone: '09123456789' });
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('otpCode');
    });

    it('should throw ForbiddenException when user is blocked', async () => {
      const mockUser = {
        id: '1',
        phone: '09123456789',
        isBlocked: true,
      };
      
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      
      await expect(service.sendOtp({ phone: '09123456789' }))
        .rejects
        .toThrow(ForbiddenException);
    });
  });

  describe('checkOtp', () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;

    it('should create tokens for valid OTP code', async () => {
      const mockUser = {
        id: '1',
        phone: '09123456789',
        phone_verify: false,
      };
      const mockTokens = {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockCacheManager.get.mockResolvedValue('123456');
      mockTokenService.createJwt.mockResolvedValue(mockTokens);

      await service.checkOtp({ phone: '09123456789', code: '123456' }, mockResponse);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ 
        where: { phone: '09123456789' } 
      });
      expect(mockCacheManager.get).toHaveBeenCalledWith('otp:1');
      expect(mockTokenService.createJwt).toHaveBeenCalledWith('1');
      expect(mockCacheManager.set).toHaveBeenCalledWith('rt:1', mockTokens.refresh_token);
      expect(mockResponse.cookie).toHaveBeenCalled();
    });

    it('should throw an error when user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.checkOtp({ phone: '09123456789', code: '123456' }, mockResponse)
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw an error when OTP code is expired', async () => {
      const mockUser = {
        id: '1',
        phone: '09123456789',
      };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockCacheManager.get.mockResolvedValue(null);

      await expect(
        service.checkOtp({ phone: '09123456789', code: '123456' }, mockResponse)
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw an error when OTP code is incorrect', async () => {
      const mockUser = {
        id: '1',
        phone: '09123456789',
      };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockCacheManager.get.mockResolvedValue('654321'); // different code

      await expect(
        service.checkOtp({ phone: '09123456789', code: '123456' }, mockResponse)
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should change phone_verify to true if it was not verified before', async () => {
      const mockUser = {
        id: '1',
        phone: '09123456789',
        phone_verify: false,
      };
      const mockTokens = {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockCacheManager.get.mockResolvedValue('123456');
      mockTokenService.createJwt.mockResolvedValue(mockTokens);

      await service.checkOtp({ phone: '09123456789', code: '123456' }, mockResponse);

      expect(mockUser.phone_verify).toBe(true);
    });
  });
});
