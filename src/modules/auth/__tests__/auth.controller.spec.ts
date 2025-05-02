import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService;

  beforeEach(async () => {
    mockAuthService = {
      sendOtp: jest
        .fn()
        .mockResolvedValue({ message: 'OTP sent', otpCode: '123456' }),
      checkOtp: jest.fn().mockResolvedValue({ message: 'OTP verified' }),
      validateAccessToken: jest.fn().mockResolvedValue({
        id: '1',
        username: 'testuser',
        phone: '09123456789',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendOtp', () => {
    it('should send OTP successfully', async () => {
      const phone = '09123456789';
      const expectedResponse = { message: 'OTP sent', otpCode: '123456' };

      const result = await controller.sendOtp({ phone });

      expect(mockAuthService.sendOtp).toHaveBeenCalledWith({ phone });
      expect(result).toEqual(expectedResponse);
    });
    it('should throw error if OTP has not expired yet', async () => {
      const phone = '09123456789';
      mockAuthService.sendOtp.mockRejectedValueOnce(
        new Error('OTP has not expired yet'),
      );

      await expect(controller.sendOtp({ phone })).rejects.toThrow(
        'OTP has not expired yet',
      );
      expect(mockAuthService.sendOtp).toHaveBeenCalledWith({ phone });
    });
  });

  describe('checkOtp', () => {
    it('should verify OTP successfully', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const otpData = { phone: '09123456789', code: '123456' };

      await controller.checkOtp(otpData, mockResponse);

      expect(mockAuthService.checkOtp).toHaveBeenCalledWith(
        otpData,
        mockResponse,
      );
    });

    it('should throw error if OTP is invalid', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const otpData = { phone: '09123456789', code: 'wrong-code' };
      mockAuthService.checkOtp.mockRejectedValueOnce(new Error('Invalid OTP'));

      await expect(controller.checkOtp(otpData, mockResponse)).rejects.toThrow(
        'Invalid OTP',
      );
    });
  });

  describe('checkLogin', () => {
    it('should return user data from request', async () => {
      const mockRequest = {
        user: {
          id: '1',
          username: 'testuser',
          phone: '09123456789',
        },
      } as any;

      const result = controller.checkLogin(mockRequest);

      expect(result).toEqual({
        user: mockRequest.user,
      });
    });
  });
});
