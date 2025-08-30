import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { JwtAuthService } from './jwt.service.js';
import { SmsService } from './sms.service.js';

@Module({
  imports: [ConfigModule],
  providers: [SmsService, JwtAuthService],
  exports: [SmsService, JwtAuthService],
})
export class AuthModule {}
