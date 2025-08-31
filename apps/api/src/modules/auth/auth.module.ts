import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { UsersModule } from '../users/users.module.js';

import { AuthController } from './auth.controller.js';
import { JwtAuthService } from './jwt.service.js';
import { SmsService } from './sms.service.js';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => UsersModule), // 순환 참조 방지
  ],
  controllers: [AuthController],
  providers: [SmsService, JwtAuthService],
  exports: [SmsService, JwtAuthService],
})
export class AuthModule {}
