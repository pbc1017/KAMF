import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TimeService } from '../../common/services/time.service.js';
import { SafetyCount } from '../../entities/safety-count.entity.js';
import { AuthModule } from '../auth/auth.module.js';

import { SafetyCacheService } from './safety-cache.service.js';
import { SafetyController } from './safety.controller.js';
import { SafetyRepository } from './safety.repository.js';
import { SafetyService } from './safety.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([SafetyCount]),
    AuthModule, // JwtAuthService를 사용하기 위해 AuthModule import
  ],
  controllers: [SafetyController],
  providers: [SafetyService, SafetyRepository, SafetyCacheService, TimeService],
  exports: [SafetyService, SafetyRepository, SafetyCacheService],
})
export class SafetyModule {}
