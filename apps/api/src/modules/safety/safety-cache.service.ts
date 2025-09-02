import { Injectable, Logger } from '@nestjs/common';

/**
 * 분단위 통계 캐시 데이터 구조
 */
export interface MinuteCacheData {
  /** 분 시간 (YYYY-MM-DDTHH:mm) */
  minute: string;
  /** 해당 시점까지의 현재 인원 */
  currentInside: number;
  /** 해당 시점까지의 총 입장 */
  increment: number;
  /** 해당 시점까지의 총 퇴장 */
  decrement: number;
  /** 캐시 생성 시간 */
  computedAt: Date;
  /** 캐시 만료 시간 */
  expiresAt: Date;
}

/**
 * 안전 관리 메모리 캐시 서비스
 * 분단위 통계를 메모리에 캐시하여 성능 최적화
 */
@Injectable()
export class SafetyCacheService {
  private readonly logger = new Logger(SafetyCacheService.name);
  private readonly cache = new Map<string, MinuteCacheData>();
  private readonly TTL_HOURS = 12; // 12시간 TTL

  constructor() {
    // 5분마다 만료된 캐시 및 6시간 이전 데이터 정리
    setInterval(() => this.cleanupExpiredCache(), 5 * 60 * 1000);
  }

  /**
   * 캐시 키 생성
   */
  private getCacheKey(date: string, minute: string): string {
    return `safety_minute_${date}_${minute}`;
  }

  /**
   * 만료 시간 계산
   */
  private getExpirationTime(): Date {
    return new Date(Date.now() + this.TTL_HOURS * 60 * 60 * 1000);
  }

  /**
   * 분단위 통계 캐시 조회
   */
  async getMinuteStats(date: string, minute: string): Promise<MinuteCacheData | null> {
    const key = this.getCacheKey(date, minute);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // 만료 확인
    if (cached.expiresAt < new Date()) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * 분단위 통계 캐시 저장
   */
  async setMinuteStats(
    date: string,
    minute: string,
    data: Omit<MinuteCacheData, 'computedAt' | 'expiresAt'>
  ): Promise<void> {
    const key = this.getCacheKey(date, minute);
    const now = new Date();

    const cacheData: MinuteCacheData = {
      ...data,
      computedAt: now,
      expiresAt: this.getExpirationTime(),
    };

    this.cache.set(key, cacheData);
  }

  /**
   * 특정 날짜의 분단위 캐시 조회 (최근 6시간만)
   */
  async getDateMinuteStats(date: string): Promise<MinuteCacheData[]> {
    const results: MinuteCacheData[] = [];
    const datePrefix = `safety_minute_${date}_`;
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    for (const [key, data] of this.cache.entries()) {
      if (key.startsWith(datePrefix)) {
        // 만료 확인 및 6시간 이전 데이터 제외
        if (data.expiresAt < now || new Date(data.minute) < sixHoursAgo) {
          this.cache.delete(key);
          continue;
        }
        results.push(data);
      }
    }

    return results.sort((a, b) => a.minute.localeCompare(b.minute));
  }

  /**
   * 특정 날짜의 캐시 무효화
   */
  async invalidateDate(date: string): Promise<number> {
    const datePrefix = `safety_minute_${date}_`;
    let deletedCount = 0;

    for (const key of this.cache.keys()) {
      if (key.startsWith(datePrefix)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.logger.log(`Invalidated ${deletedCount} cache entries for date: ${date}`);
    }
    return deletedCount;
  }

  /**
   * 전체 캐시 무효화
   */
  async invalidateAll(): Promise<number> {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.log(`Cleared all cache entries: ${size}`);
    return size;
  }

  /**
   * 만료된 캐시 및 6시간 이전 데이터 자동 정리
   */
  private cleanupExpiredCache(): void {
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    for (const [key, data] of this.cache.entries()) {
      // TTL 만료 또는 6시간 이전 데이터 정리
      const shouldCleanup =
        data.expiresAt < now || // TTL 만료
        new Date(data.minute) < sixHoursAgo; // 6시간 이전 데이터

      if (shouldCleanup) {
        this.cache.delete(key);
      }
    }

    // 만료된 캐시 정리 완료 (로그 제거로 성능 최적화)
  }

  /**
   * 캐시 통계 조회
   */
  getCacheStats(): {
    totalEntries: number;
    memoryUsageEstimate: string;
    oldestEntry?: Date;
    newestEntry?: Date;
  } {
    const entries = Array.from(this.cache.values());
    const totalEntries = entries.length;

    // 메모리 사용량 추정 (대략적)
    const avgEntrySize = 200; // bytes
    const memoryBytes = totalEntries * avgEntrySize;
    const memoryUsageEstimate =
      memoryBytes < 1024
        ? `${memoryBytes} B`
        : memoryBytes < 1024 * 1024
          ? `${(memoryBytes / 1024).toFixed(1)} KB`
          : `${(memoryBytes / 1024 / 1024).toFixed(1)} MB`;

    const computedTimes = entries.map(e => e.computedAt).sort();
    const oldestEntry = computedTimes[0];
    const newestEntry = computedTimes[computedTimes.length - 1];

    return {
      totalEntries,
      memoryUsageEstimate,
      oldestEntry,
      newestEntry,
    };
  }
}
