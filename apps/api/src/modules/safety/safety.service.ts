import {
  CountRequestDto,
  CountResponseDto,
  StatsResponseDto,
  HistoryResponseDto,
  UserStatsDto,
} from '@kamf/interface';
import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';

import { TimeService } from '../../common/services/time.service.js';

import { SafetyRepository } from './safety.repository.js';

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name);

  constructor(
    private readonly safetyRepository: SafetyRepository,
    private readonly timeService: TimeService,
    private readonly dataSource: DataSource
  ) {}

  /**
   * 사용자의 카운트를 업데이트 (동시성 처리 포함)
   */
  async updateCount(userId: string, request: CountRequestDto): Promise<CountResponseDto> {
    const { increment = 0, decrement = 0 } = request;

    // 입력 검증 (누적 총계 방식이므로 둘 다 0이어도 유효함)

    if (increment > 1000 || decrement > 1000) {
      throw new BadRequestException('하루 총 카운트는 1000개 이하여야 합니다');
    }

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // 트랜잭션 내에서 카운트 업데이트
        await this.safetyRepository.upsertCount(userId, increment, decrement, queryRunner);

        await queryRunner.commitTransaction();

        // 업데이트 후 현재 통계 조회
        const [totalStats, userStats] = await Promise.all([
          this.safetyRepository.getDailyTotalStats(),
          this.getUserStats(userId),
        ]);

        this.logger.log(
          `User ${userId} set daily totals: increment=${increment}, decrement=${decrement}. Current inside: ${totalStats.currentInside}`
        );

        return {
          success: true,
          currentTotal: totalStats.currentInside,
          userStats,
        };
      } catch (error) {
        await queryRunner.rollbackTransaction();

        if (error instanceof QueryFailedError) {
          // 낙관적 락 충돌이나 유니크 제약 조건 위반 시 재시도
          if (
            error.message.includes('version') ||
            error.message.includes('Duplicate entry') ||
            error.driverError?.errno === 1062
          ) {
            retryCount++;
            this.logger.warn(
              `Optimistic lock conflict for user ${userId}, retrying... (${retryCount}/${maxRetries})`
            );

            if (retryCount < maxRetries) {
              // 짧은 지연 후 재시도
              await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
              continue;
            } else {
              throw new ConflictException(
                '동시에 너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
              );
            }
          }
        }

        this.logger.error(`Error updating count for user ${userId}:`, error);
        throw error;
      } finally {
        await queryRunner.release();
      }
    }
  }

  /**
   * 현재 통계 조회
   */
  async getStats(userId: string, date?: string): Promise<StatsResponseDto> {
    const targetDate = date || this.timeService.getCurrentUTCDate();

    // 날짜 유효성 검증
    if (!this.timeService.isValidDateString(targetDate)) {
      throw new BadRequestException('올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)');
    }

    try {
      const [totalStats, userStats, hourlyStats] = await Promise.all([
        this.safetyRepository.getDailyTotalStats(targetDate),
        this.getUserStats(userId, targetDate),
        this.safetyRepository.getHourlyStats(targetDate),
      ]);

      return {
        date: targetDate,
        currentTotal: totalStats.currentInside,
        todayStats: totalStats,
        userStats,
        hourlyStats,
      };
    } catch (error) {
      this.logger.error(`Error getting stats for user ${userId} on ${targetDate}:`, error);
      throw error;
    }
  }

  /**
   * 히스토리 조회
   */
  async getHistory(
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<HistoryResponseDto> {
    // 날짜 유효성 검증
    if (
      !this.timeService.isValidDateString(startDate) ||
      !this.timeService.isValidDateString(endDate)
    ) {
      throw new BadRequestException('올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)');
    }

    // 날짜 범위 검증
    const daysDiff = this.timeService.getDaysDifference(startDate, endDate);
    if (daysDiff < 0) {
      throw new BadRequestException('시작 날짜가 종료 날짜보다 늦습니다');
    }

    if (daysDiff > 90) {
      throw new BadRequestException('최대 90일까지만 조회할 수 있습니다');
    }

    try {
      const [history, summary] = await Promise.all([
        this.safetyRepository.getHistoryByDateRange(startDate, endDate, userId),
        this.safetyRepository.getSummaryStats(startDate, endDate),
      ]);

      return {
        history,
        period: {
          startDate,
          endDate,
          totalDays: daysDiff + 1,
        },
        summary,
      };
    } catch (error) {
      this.logger.error(`Error getting history from ${startDate} to ${endDate}:`, error);
      throw error;
    }
  }

  /**
   * 사용자 개인 통계 조회 (private method)
   */
  private async getUserStats(userId: string, date?: string): Promise<UserStatsDto> {
    const targetDate = date || this.timeService.getCurrentUTCDate();
    const userCount = await this.safetyRepository.findByUserAndDate(userId, targetDate);

    if (!userCount) {
      return {
        increment: 0,
        decrement: 0,
        netCount: 0,
      };
    }

    return {
      increment: userCount.increment,
      decrement: userCount.decrement,
      netCount: userCount.netCount,
    };
  }

  /**
   * 시스템 상태 확인 (Health check용)
   */
  async getHealthStatus(): Promise<{
    status: string;
    recentActivity: boolean;
    currentDate: string;
    totalToday: number;
  }> {
    try {
      const [recentActivity, totalStats] = await Promise.all([
        this.safetyRepository.hasRecentActivity(5),
        this.safetyRepository.getDailyTotalStats(),
      ]);

      return {
        status: 'healthy',
        recentActivity,
        currentDate: this.timeService.getCurrentUTCDate(),
        totalToday: totalStats.currentInside,
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        recentActivity: false,
        currentDate: this.timeService.getCurrentUTCDate(),
        totalToday: 0,
      };
    }
  }

  /**
   * 관리자용: 특정 사용자의 데이터 초기화
   */
  async resetUserData(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.safetyRepository.deleteByUserId(userId);
      this.logger.warn(`Admin reset data for user ${userId}`);

      return {
        success: true,
        message: `사용자 ${userId}의 모든 안전 카운트 데이터가 삭제되었습니다`,
      };
    } catch (error) {
      this.logger.error(`Error resetting data for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 관리자용: 특정 날짜의 모든 데이터 초기화
   */
  async resetDateData(date: string): Promise<{ success: boolean; message: string }> {
    if (!this.timeService.isValidDateString(date)) {
      throw new BadRequestException('올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)');
    }

    try {
      await this.safetyRepository.deleteByDate(date);
      this.logger.warn(`Admin reset data for date ${date}`);

      return {
        success: true,
        message: `${date}의 모든 안전 카운트 데이터가 삭제되었습니다`,
      };
    } catch (error) {
      this.logger.error(`Error resetting data for date ${date}:`, error);
      throw error;
    }
  }
}
