import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { VisitorAnalytics } from '../../entities/visitor-analytics.entity.js';

import { TrackVisitorDto } from './analytics.dto.js';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(VisitorAnalytics)
    private readonly visitorAnalyticsRepository: Repository<VisitorAnalytics>
  ) {}

  /**
   * 방문자 추적 데이터 저장
   * @param trackData 추적 데이터
   * @param userId 사용자 ID (로그인된 경우)
   * @returns 저장된 VisitorAnalytics
   */
  async trackVisitor(trackData: TrackVisitorDto, userId?: string): Promise<VisitorAnalytics> {
    try {
      const visitorAnalytics = this.visitorAnalyticsRepository.create({
        landingPage: trackData.landingPage,
        userAgent: trackData.userAgent || null,
        userId: userId || null,
        visitedAt: new Date(),
      });

      const saved = await this.visitorAnalyticsRepository.save(visitorAnalytics);

      this.logger.log(`Visitor tracked: ${trackData.landingPage} (User: ${userId || 'anonymous'})`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to track visitor: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 총 방문자 수 조회 (필요시 사용)
   * @returns 총 방문자 수
   */
  async getTotalVisitorCount(): Promise<number> {
    return await this.visitorAnalyticsRepository.count();
  }

  /**
   * 특정 페이지 방문 수 조회 (필요시 사용)
   * @param landingPage 페이지 경로
   * @returns 해당 페이지 방문 수
   */
  async getPageVisitorCount(landingPage: string): Promise<number> {
    return await this.visitorAnalyticsRepository.count({
      where: { landingPage },
    });
  }
}
