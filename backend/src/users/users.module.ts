import { Module } from '@nestjs/common';
import { UsersAdminController } from './users-admin.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersAdminController],
  providers: [UsersService],
})
export class UsersModule {}
