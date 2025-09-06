import { HistoryItemDto } from '@kamf/interface';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, Between } from 'typeorm';

import { TimeService } from '../../common/services/time.service.js';
import { SafetyCount } from '../../entities/safety-count.entity.js';

@Injectable()
export class SafetyRepository {
  private readonly logger = new Logger(SafetyRepository.name);

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
    const startOfDay = `${targetDate} 00:00:00`;
    const endOfDay = `${targetDate} 23:59:59`;

    return this.safetyCountRepository.findOne({
      where: {
        userId,
        createdAt: Between(new Date(startOfDay), new Date(endOfDay)),
      },
      order: { createdAt: 'DESC' }, // 최신 레코드 첫 번째
    });
  }

  /**
   * 새로운 SafetyCount 레코드 생성
   */
  async create(userId: string): Promise<SafetyCount> {
    const safetyCount = this.safetyCountRepository.create({
      userId,
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
  async createCount(
    userId: string,
    totalIncrement: number = 0,
    totalDecrement: number = 0,
    queryRunner?: QueryRunner
  ): Promise<SafetyCount> {
    const repository = queryRunner
      ? queryRunner.manager.getRepository(SafetyCount)
      : this.safetyCountRepository;

    // 항상 새로운 레코드 생성 (매 5초마다)
    const safetyCount = repository.create({
      userId,
      increment: totalIncrement,
      decrement: totalDecrement,
    });

    return repository.save(safetyCount);
  }

  /**
   * 특정 날짜의 전체 통계 조회 (각 유저의 최신값 합계)
   */
  async getDailyTotalStats(date?: string): Promise<{
    totalIncrement: number;
    totalDecrement: number;
    currentInside: number;
  }> {
    const targetDate = date || this.timeService.getCurrentUTCDate();

    // 각 유저별 최신 레코드를 가져와서 합산 (Raw SQL 사용)
    const latestRecords = await this.safetyCountRepository.query(
      `
      SELECT sc.userId, sc.increment, sc.decrement
      FROM safety_counts sc
      WHERE DATE(sc.createdAt) = ?
        AND sc.createdAt = (
          SELECT MAX(sc2.createdAt) 
          FROM safety_counts sc2 
          WHERE sc2.userId = sc.userId 
            AND DATE(sc2.createdAt) = ?
        )
      GROUP BY sc.userId, sc.increment, sc.decrement
      `,
      [targetDate, targetDate]
    );

    // 집계 계산
    let totalIncrement = 0;
    let totalDecrement = 0;

    for (const record of latestRecords) {
      totalIncrement += parseInt(record.increment) || 0;
      totalDecrement += parseInt(record.decrement) || 0;
    }

    const currentInside = totalIncrement - totalDecrement;

    return {
      totalIncrement,
      totalDecrement,
      currentInside: Math.max(0, currentInside), // 음수 방지
    };
  }

  /**
   * 특정 분의 통계를 DB에서 계산 (캐시용)
   */

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
    const startOfDay = `${date} 00:00:00`;
    const endOfDay = `${date} 23:59:59`;

    await this.safetyCountRepository.delete({
      createdAt: Between(new Date(startOfDay), new Date(endOfDay)),
    });
  }
}
