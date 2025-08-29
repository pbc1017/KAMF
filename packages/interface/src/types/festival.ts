/**
 * Festival related types and interfaces
 */

/**
 * 무대를 제외한 지도상 구역
 */
export enum Zone {
  BOOTH = 'booth',
  INFO = 'info',
  FOOD_TRUCK = 'foodTruck',
  HOF = 'hof',
}

/**
 * 축제 날짜
 */
export enum FestivalDay {
  SATURDAY = 'SAT',
  SUNDAY = 'SUN',
}

/**
 * XX:XX 형태의 시간 문자열
 */
export type Time = string;

/**
 * 부스 정보
 */
export interface Booth {
  id: number;
  titleKr: string;
  titleEn: string;
  zone: Zone;
  description: string; // 부스 소개
}

/**
 * 공연 정보
 */
export interface Stage {
  id: number;
  titleKr: string;
  titleEn: string;
  startTime: Time;
  endTime: Time;
  description: string; // 공연 소개
}

/**
 * 날짜가 포함된 공연 정보
 */
export interface StageWithDay extends Stage {
  day: FestivalDay;
}
