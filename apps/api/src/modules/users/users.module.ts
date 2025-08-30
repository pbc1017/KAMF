import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Role } from '../../entities/role.entity.js';
import { User } from '../../entities/user.entity.js';
import { AuthModule } from '../auth/auth.module.js';

import { UsersController } from './users.controller.js';
import { UserService } from './users.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    forwardRef(() => AuthModule), // 순환 참조 방지
  ],
  controllers: [UsersController],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}
