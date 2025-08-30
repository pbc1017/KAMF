import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthCode } from '../../entities/auth-code.entity.js';

import { JwtAuthService } from './jwt.service.js';
import { SmsService } from './sms.service.js';
import { TotpService } from './totp.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([AuthCode]), ConfigModule],
  providers: [TotpService, SmsService, JwtAuthService],
  exports: [TotpService, SmsService, JwtAuthService],
})
export class AuthModule {}
