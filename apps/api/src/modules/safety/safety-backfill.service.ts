import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { SafetyComputeService } from './safety-compute.service.js';
import { SafetyMinuteStatsRepository } from './safety-minute-stats.repository.js';

@Injectable()
export class SafetyBackfillService {
  private readonly logger = new Logger(SafetyBackfillService.name);
  private isRunning = false;

  constructor(
    private readonly minuteStatsRepository: SafetyMinuteStatsRepository,
    private readonly computeService: SafetyComputeService
  ) {}

  @Cron('30 */5 * * * *', { name: 'backfillMissingStats' })
  async backfillMissingStats(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Backfill is already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      const missingMinutes = await this.minuteStatsRepository.findMissingMinutes(6);

      if (missingMinutes.length === 0) {
        this.logger.debug('No missing minutes found in the last 6 hours');
        return;
      }

      this.logger.log(`Found ${missingMinutes.length} missing minutes to backfill`);

      const batchSize = 30;
      const batches = this.chunkArray(missingMinutes, batchSize);

      let processedCount = 0;
      let successCount = 0;

      for (const batch of batches) {
        const batchResults = await this.processBatch(batch);
        processedCount += batch.length;
        successCount += batchResults.filter(r => r.success).length;

        if (batches.length > 1) {
          await this.sleep(500);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Backfill completed: ${successCount}/${processedCount} minutes processed successfully (${duration}ms)`
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Backfill failed after ${duration}ms:`, error);
    } finally {
      this.isRunning = false;
    }
  }

  private async processBatch(
    minutes: Date[]
  ): Promise<Array<{ minute: Date; success: boolean; error?: string }>> {
    const results = await Promise.allSettled(
      minutes.map(async minute => {
        const stats = await this.computeService.computeSingleMinuteStats(minute);
        await this.minuteStatsRepository.upsertMinuteStats(stats);
        return { minute, success: true };
      })
    );

    return results.map((result, index) => {
      const minute = minutes[index];
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        this.logger.error(`Failed to backfill minute ${minute.toISOString()}:`, result.reason);
        return {
          minute,
          success: false,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });
  }

  async backfillRecentHours(hours: number): Promise<number> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    startTime.setSeconds(0, 0);
    endTime.setSeconds(0, 0);

    const result = await this.backfillDateRange(startTime, endTime);
    return result.successfulMinutes;
  }

  async backfillDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalMinutes: number;
    processedMinutes: number;
    successfulMinutes: number;
    failedMinutes: number;
    duration: number;
  }> {
    const startTime = Date.now();
    this.logger.log(
      `Manual backfill started: ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    const allMinutes: Date[] = [];

    for (
      let current = new Date(startDate);
      current <= endDate;
      current.setMinutes(current.getMinutes() + 1)
    ) {
      const minute = new Date(current);
      minute.setSeconds(0, 0);
      allMinutes.push(minute);
    }

    const missingMinutes: Date[] = [];
    for (const minute of allMinutes) {
      const exists = await this.minuteStatsRepository.existsByMinute(minute);
      if (!exists) {
        missingMinutes.push(minute);
      }
    }

    this.logger.log(
      `Found ${missingMinutes.length} missing minutes out of ${allMinutes.length} total minutes`
    );

    if (missingMinutes.length === 0) {
      return {
        totalMinutes: allMinutes.length,
        processedMinutes: 0,
        successfulMinutes: 0,
        failedMinutes: 0,
        duration: Date.now() - startTime,
      };
    }

    const batchSize = 30;
    const batches = this.chunkArray(missingMinutes, batchSize);

    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;

    for (const batch of batches) {
      const batchResults = await this.processBatch(batch);
      processedCount += batch.length;

      for (const result of batchResults) {
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
        }
      }

      this.logger.log(`Batch progress: ${processedCount}/${missingMinutes.length} processed`);

      if (batches.length > 1) {
        await this.sleep(1000);
      }
    }

    const duration = Date.now() - startTime;
    const result = {
      totalMinutes: allMinutes.length,
      processedMinutes: processedCount,
      successfulMinutes: successCount,
      failedMinutes: failedCount,
      duration,
    };

    this.logger.log(`Manual backfill completed:`, result);
    return result;
  }

  getStatus(): {
    serviceName: string;
    isRunning: boolean;
    isHealthy: boolean;
  } {
    return {
      serviceName: 'SafetyBackfillService',
      isRunning: this.isRunning,
      isHealthy: true,
    };
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
