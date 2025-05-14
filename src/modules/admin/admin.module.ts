import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admIn.service';
@Module({
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
