import { Injectable } from '@nestjs/common';

@Injectable()
export class TimeService {
  /**
   * 현재 UTC 날짜를 YYYY-MM-DD 형식으로 반환
   */
  getCurrentUTCDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * 현재 UTC 시간을 반환 (0-23)
   */
  getCurrentUTCHour(): number {
    return new Date().getUTCHours();
  }

  /**
   * 현재 UTC 날짜와 시간을 ISO 문자열로 반환
   */
  getCurrentUTCDateTime(): string {
    return new Date().toISOString();
  }

  /**
   * 특정 날짜의 UTC 날짜 범위를 반환
   * @param days 오늘부터 며칠 전까지 (기본 7일)
   */
  getUTCDateRange(days: number = 7): { start: string; end: string } {
    const end = this.getCurrentUTCDate();
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - days + 1); // +1을 해서 오늘 포함
    const start = startDate.toISOString().split('T')[0];

    return { start, end };
  }

  /**
   * 특정 날짜 문자열이 유효한 YYYY-MM-DD 형식인지 검증
   */
  isValidDateString(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }

    const date = new Date(dateString);
    return date.toISOString().split('T')[0] === dateString;
  }

  /**
   * 날짜 문자열을 Date 객체로 변환 (UTC 기준)
   */
  parseUTCDate(dateString: string): Date {
    if (!this.isValidDateString(dateString)) {
      throw new Error(`Invalid date format: ${dateString}. Expected YYYY-MM-DD`);
    }
    return new Date(dateString + 'T00:00:00.000Z');
  }

  /**
   * Date 객체를 YYYY-MM-DD 형식의 UTC 날짜 문자열로 변환
   */
  formatUTCDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 두 날짜 사이의 일수 차이 계산
   */
  getDaysDifference(startDate: string, endDate: string): number {
    const start = this.parseUTCDate(startDate);
    const end = this.parseUTCDate(endDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 오늘부터 N일 후의 날짜를 반환
   */
  addDaysToToday(days: number): string {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + days);
    return this.formatUTCDate(date);
  }

  /**
   * 특정 날짜의 24시간 범위 배열 생성 (통계용)
   */
  getHourlyTimeSlots(
    date: string = this.getCurrentUTCDate()
  ): Array<{ hour: number; dateTime: string }> {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push({
        hour,
        dateTime: `${date}T${hour.toString().padStart(2, '0')}:00:00.000Z`,
      });
    }
    return slots;
  }

  /**
   * 현재 시각이 특정 시간 범위 내에 있는지 확인 (UTC 기준)
   */
  isInTimeRange(startHour: number, endHour: number): boolean {
    const currentHour = this.getCurrentUTCHour();
    if (startHour <= endHour) {
      return currentHour >= startHour && currentHour <= endHour;
    } else {
      // 자정을 넘는 경우 (예: 22시 ~ 6시)
      return currentHour >= startHour || currentHour <= endHour;
    }
  }
}
