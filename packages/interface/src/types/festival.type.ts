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
  NIGHT_MARKET = 'nightMarket',
}

/**
 * 축제 날짜
 */
export enum FestivalDay {
  FRIDAY = 'FRI',
  SATURDAY = 'SAT',
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
  boothNumber: string;
  titleKo: string;
  titleEn: string;
  zone: Zone;
  descriptionKo: string; // 부스 소개 (한국어)
  descriptionEn: string; // 부스 소개 (영어)
}

/**
 * 공연 정보
 */
export interface Stage {
  id: number;
  titleKo: string;
  titleEn: string;
  startTime: Time;
  endTime: Time;
  descriptionKo: string; // 공연 소개 (한국어)
  descriptionEn: string; // 공연 소개 (영어)
}

/**
 * 날짜가 포함된 공연 정보
 */
export interface StageWithDay extends Stage {
  day: FestivalDay;
}
