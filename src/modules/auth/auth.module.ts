import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { TokenService } from './token.service';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.register({ global: true }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService],
  exports: [AuthService],
})
export class AuthModule {}
