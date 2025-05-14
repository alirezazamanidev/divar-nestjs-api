import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Scope,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import {
  
  PublicMessage,
} from 'src/common/enums';
import { existsSync, unlinkSync } from 'fs';
import { UserEntity } from '../entities/user.entity';
import { UpdateProfileDto } from '../dto/user.dto';

@Injectable({ scope: Scope.REQUEST })
export class ProfileService {
  constructor(
    @Inject(REQUEST) private request: Request,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findOneById(userId: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('کاربر مورد نظر یافت نشد');
    }

    return user;
  }

  async updateProfile(updateProfileDto: UpdateProfileDto) {
    // Find user by ID
    const user = await this.findOneById(this.request.user.id);

    // Define fields that can be updated
    const updateFields = ['username', 'email', 'fullname', 'bio'] as const;

    // Process each field in the DTO
    for (const field of updateFields) {
      const value = updateProfileDto[field];

      // Skip undefined values
      if (value === undefined) continue;

      // Handle unique constraint validations
      if (['email', 'username'].includes(field)) {
        // Build query condition for unique check
        const whereCondition = {
          [field]: value,
          id: Not(this.request.user.id),
        };

        // Check if value already exists for another user
        const existingUser = await this.userRepository.findOne({
          where: whereCondition,
        });

        if (existingUser) {
          const errorMessages = {
            email: 'این ایمیل قبلا ثبت شده است',

            username: 'این نام کاربری قبلا ثبت شده است',
          };
          throw new ConflictException(errorMessages[field]);
        }

        // Reset verification status when email or phone changes
        if (field === 'email') user.email_verify = false;
      }

      // Update the field
      user[field] = value;
    }

    // Save changes with error handling
    try {
      await this.userRepository.save(user);
      return {
        message: PublicMessage.UpdateProfile,
      };
    } catch (error) {
      throw new InternalServerErrorException('خطا در بروزرسانی پروفایل', {
        cause: error,
        description: 'خطا در ذخیره‌سازی تغییرات پروفایل کاربر',
      });
    }
  }

 
 

}
