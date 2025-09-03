import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { UsersModule } from '../users/users.module.js';

import { AuthController } from './auth.controller.js';
import { EmailService } from './email.service.js';
import { JwtAuthService } from './jwt.service.js';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => UsersModule), // 순환 참조 방지
  ],
  controllers: [AuthController],
  providers: [EmailService, JwtAuthService],
  exports: [EmailService, JwtAuthService],
})
export class AuthModule {}
