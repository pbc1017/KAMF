import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TimeService } from '../../common/services/time.service.js';
import { SafetyCount } from '../../entities/safety-count.entity.js';
import { SafetyMinuteStats } from '../../entities/safety-minute-stats.entity.js';
import { AuthModule } from '../auth/auth.module.js';

import { SafetyBackfillService } from './safety-backfill.service.js';
import { SafetyComputeService } from './safety-compute.service.js';
import { SafetyMinuteStatsRepository } from './safety-minute-stats.repository.js';
import { SafetyController } from './safety.controller.js';
import { SafetyRepository } from './safety.repository.js';
import { SafetyService } from './safety.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([SafetyCount, SafetyMinuteStats]),
    ScheduleModule.forRoot(), // 크론 스케줄러 활성화
    AuthModule, // JwtAuthService를 사용하기 위해 AuthModule import
  ],
  controllers: [SafetyController],
  providers: [
    SafetyService,
    SafetyRepository,
    SafetyMinuteStatsRepository,
    SafetyComputeService,
    SafetyBackfillService,
    TimeService,
  ],
  exports: [
    SafetyService,
    SafetyRepository,
    SafetyMinuteStatsRepository,
    SafetyComputeService,
    SafetyBackfillService,
  ],
})
export class SafetyModule {}
