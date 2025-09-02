import { HistoryItemDto, HourlyStatsDto } from '@kamf/interface';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';

import { TimeService } from '../../common/services/time.service.js';
import { SafetyCount } from '../../entities/safety-count.entity.js';

@Injectable()
export class SafetyRepository {
  constructor(
    @InjectRepository(SafetyCount)
    private readonly safetyCountRepository: Repository<SafetyCount>,
    private readonly timeService: TimeService
  ) {}

  /**
   * 특정 사용자의 특정 날짜 안전 카운트 조회 (없으면 null 반환)
   */
  async findByUserAndDate(userId: string, date?: string): Promise<SafetyCount | null> {
    const targetDate = date || this.timeService.getCurrentUTCDate();

    return this.safetyCountRepository.findOne({
      where: { userId, date: targetDate },
    });
  }

  /**
   * 새로운 SafetyCount 레코드 생성
   */
  async create(userId: string, date?: string): Promise<SafetyCount> {
    const targetDate = date || this.timeService.getCurrentUTCDate();

    const safetyCount = this.safetyCountRepository.create({
      userId,
      date: targetDate,
      increment: 0,
      decrement: 0,
    });

    return this.safetyCountRepository.save(safetyCount);
  }

  /**
   * SafetyCount 레코드 업데이트 (낙관적 락 적용)
   */
  async save(safetyCount: SafetyCount): Promise<SafetyCount> {
    return this.safetyCountRepository.save(safetyCount);
  }

  /**
   * 특정 사용자의 하루 총 안전 카운트를 설정 (Upsert 패턴)
   * @param userId 사용자 ID
   * @param totalIncrement 하루 총 입장 카운트 (누적)
   * @param totalDecrement 하루 총 퇴장 카운트 (누적)
   * @param queryRunner 트랜잭션용 QueryRunner
   */
  async upsertCount(
    userId: string,
    totalIncrement: number = 0,
    totalDecrement: number = 0,
    queryRunner?: QueryRunner
  ): Promise<SafetyCount> {
    const repository = queryRunner
      ? queryRunner.manager.getRepository(SafetyCount)
      : this.safetyCountRepository;

    const today = this.timeService.getCurrentUTCDate();

    // 기존 레코드 조회 또는 생성
    let safetyCount = await repository.findOne({
      where: { userId, date: today },
    });

    if (!safetyCount) {
      safetyCount = repository.create({
        userId,
        date: today,
        increment: 0,
        decrement: 0,
      });
    }

    // 카운트 업데이트 (하루 총 누적값으로 설정)
    safetyCount.increment = totalIncrement;
    safetyCount.decrement = totalDecrement;

    return repository.save(safetyCount);
  }

  /**
   * 특정 날짜의 전체 통계 조회
   */
  async getDailyTotalStats(date?: string): Promise<{
    totalIncrement: number;
    totalDecrement: number;
    currentInside: number;
  }> {
    const targetDate = date || this.timeService.getCurrentUTCDate();

    const result = await this.safetyCountRepository
      .createQueryBuilder('sc')
      .select([
        'SUM(sc.increment) as totalIncrement',
        'SUM(sc.decrement) as totalDecrement',
        '(SUM(sc.increment) - SUM(sc.decrement)) as currentInside',
      ])
      .where('sc.date = :date', { date: targetDate })
      .getRawOne();

    return {
      totalIncrement: parseInt(result?.totalIncrement) || 0,
      totalDecrement: parseInt(result?.totalDecrement) || 0,
      currentInside: parseInt(result?.currentInside) || 0,
    };
  }

  /**
   * 시간대별 통계 조회 (가상 데이터 - 실제로는 더 복잡한 로직 필요)
   */
  async getHourlyStats(date?: string): Promise<HourlyStatsDto[]> {
    const targetDate = date || this.timeService.getCurrentUTCDate();
    const hourlySlots = this.timeService.getHourlyTimeSlots(targetDate);

    // 현재는 균등 분배로 가상 데이터 생성
    // 실제로는 createdAt 필드를 기반으로 시간대별 집계가 필요
    const dailyStats = await this.getDailyTotalStats(targetDate);
    const hourlyIncrement = Math.floor(dailyStats.totalIncrement / 24);
    const hourlyDecrement = Math.floor(dailyStats.totalDecrement / 24);

    let cumulativeTotal = 0;

    return hourlySlots.map(slot => {
      const increment = slot.hour <= this.timeService.getCurrentUTCHour() ? hourlyIncrement : 0;
      const decrement = slot.hour <= this.timeService.getCurrentUTCHour() ? hourlyDecrement : 0;
      cumulativeTotal += increment - decrement;

      return {
        hour: slot.hour,
        increment,
        decrement,
        total: Math.max(0, cumulativeTotal),
      };
    });
  }

  /**
   * 날짜 범위별 히스토리 조회
   */
  async getHistoryByDateRange(
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<HistoryItemDto[]> {
    const query = this.safetyCountRepository
      .createQueryBuilder('sc')
      .select([
        'sc.date as date',
        'SUM(sc.increment) as totalIncrement',
        'SUM(sc.decrement) as totalDecrement',
        '(SUM(sc.increment) - SUM(sc.decrement)) as netCount',
      ])
      .where('sc.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('sc.date')
      .orderBy('sc.date', 'ASC');

    if (userId) {
      query.andWhere('sc.userId = :userId', { userId });
    }

    const results = await query.getRawMany();

    return results.map(result => ({
      date: result.date,
      totalIncrement: parseInt(result.totalIncrement) || 0,
      totalDecrement: parseInt(result.totalDecrement) || 0,
      netCount: parseInt(result.netCount) || 0,
    }));
  }

  /**
   * 전체 통계 요약 조회
   */
  async getSummaryStats(
    startDate: string,
    endDate: string
  ): Promise<{
    totalIncrement: number;
    totalDecrement: number;
    averageDaily: number;
    peakDay: string;
    peakCount: number;
  }> {
    const result = await this.safetyCountRepository
      .createQueryBuilder('sc')
      .select([
        'SUM(sc.increment) as totalIncrement',
        'SUM(sc.decrement) as totalDecrement',
        'sc.date as date',
        '(SUM(sc.increment) - SUM(sc.decrement)) as dailyNet',
      ])
      .where('sc.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('sc.date')
      .orderBy('dailyNet', 'DESC')
      .getRawMany();

    if (result.length === 0) {
      return {
        totalIncrement: 0,
        totalDecrement: 0,
        averageDaily: 0,
        peakDay: startDate,
        peakCount: 0,
      };
    }

    const totalIncrement = result.reduce(
      (sum, item) => sum + (parseInt(item.totalIncrement) || 0),
      0
    );
    const totalDecrement = result.reduce(
      (sum, item) => sum + (parseInt(item.totalDecrement) || 0),
      0
    );
    const peakItem = result[0];
    const daysDiff = this.timeService.getDaysDifference(startDate, endDate) + 1;

    return {
      totalIncrement,
      totalDecrement,
      averageDaily: Math.round((totalIncrement - totalDecrement) / daysDiff),
      peakDay: peakItem.date,
      peakCount: parseInt(peakItem.dailyNet) || 0,
    };
  }

  /**
   * 최근 활동 확인 (Health check용)
   */
  async hasRecentActivity(minutes: number = 5): Promise<boolean> {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);

    const count = await this.safetyCountRepository
      .createQueryBuilder('sc')
      .where('sc.updatedAt >= :cutoffTime', { cutoffTime })
      .getCount();

    return count > 0;
  }

  /**
   * 특정 사용자의 모든 레코드 삭제 (관리자용)
   */
  async deleteByUserId(userId: string): Promise<void> {
    await this.safetyCountRepository.delete({ userId });
  }

  /**
   * 특정 날짜의 모든 레코드 삭제 (관리자용)
   */
  async deleteByDate(date: string): Promise<void> {
    await this.safetyCountRepository.delete({ date });
  }
}
