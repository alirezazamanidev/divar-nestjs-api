import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { WalletEntity } from './entities/wallet.entity';

import { WalletService } from './wallet.service';
  
@Module({
  imports:[TypeOrmModule.forFeature([UserEntity,WalletEntity])],
  controllers: [UserController],
  providers: [UserService,WalletService],

  exports:[WalletService]
})
export class UserModule {}
