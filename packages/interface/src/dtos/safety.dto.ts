/**
 * Safety Management related DTOs (Data Transfer Objects)
 * 안전 관리 관련 데이터 전송 객체들
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsDateString, IsUUID } from 'class-validator';

/**
 * 안전 카운트 요청 DTO (Interface)
 */
export interface CountRequest {
  /** 하루 총 입장 카운트 (누적 총계, 기본값: 0) */
  increment?: number;
  /** 하루 총 퇴장 카운트 (누적 총계, 기본값: 0) */
  decrement?: number;
}

/**
 * 안전 카운트 요청 DTO (NestJS Class)
 */
export class CountRequestDto implements CountRequest {
  @ApiProperty({
    description: '하루 총 입장 카운트 (누적 총계, 기본값: 0)',
    default: 0,
    minimum: 0,
    example: 120,
  })
  @IsOptional()
  @IsInt({ message: '입장 카운트는 정수여야 합니다' })
  @Min(0, { message: '입장 카운트는 0 이상이어야 합니다' })
  increment?: number = 0;

  @ApiProperty({
    description: '하루 총 퇴장 카운트 (누적 총계, 기본값: 0)',
    default: 0,
    minimum: 0,
    example: 100,
  })
  @IsOptional()
  @IsInt({ message: '퇴장 카운트는 정수여야 합니다' })
  @Min(0, { message: '퇴장 카운트는 0 이상이어야 합니다' })
  decrement?: number = 0;
}

/**
 * 사용자 통계 DTO (Interface)
 */
export interface UserStats {
  /** 사용자의 입장 카운트 */
  increment: number;
  /** 사용자의 퇴장 카운트 */
  decrement: number;
  /** 사용자의 순 카운트 (입장-퇴장) */
  netCount: number;
}

/**
 * 사용자 통계 DTO (NestJS Class)
 */
export class UserStatsDto implements UserStats {
  @ApiProperty({ description: '사용자의 입장 카운트', example: 10 })
  increment: number;

  @ApiProperty({ description: '사용자의 퇴장 카운트', example: 8 })
  decrement: number;

  @ApiProperty({ description: '사용자의 순 카운트 (입장-퇴장)', example: 2 })
  netCount: number;
}

/**
 * 오늘 통계 DTO (Interface)
 */
export interface TodayStats {
  /** 오늘 총 입장 카운트 */
  totalIncrement: number;
  /** 오늘 총 퇴장 카운트 */
  totalDecrement: number;
  /** 현재 축제장 내 인원 (입장-퇴장) */
  currentInside: number;
}

/**
 * 오늘 통계 DTO (NestJS Class)
 */
export class TodayStatsDto implements TodayStats {
  @ApiProperty({ description: '오늘 총 입장 카운트', example: 150 })
  totalIncrement: number;

  @ApiProperty({ description: '오늘 총 퇴장 카운트', example: 120 })
  totalDecrement: number;

  @ApiProperty({ description: '현재 축제장 내 인원 (입장-퇴장)', example: 30 })
  currentInside: number;
}

/**
 * 시간대별 통계 DTO (Interface) - 호환성 유지
 */
export interface HourlyStats {
  /** 시간 (0-23) */
  hour: number;
  /** 해당 시간의 입장 카운트 */
  increment: number;
  /** 해당 시간의 퇴장 카운트 */
  decrement: number;
  /** 해당 시간까지의 누적 인원 */
  total: number;
}

/**
 * 시간대별 통계 DTO (NestJS Class) - 호환성 유지
 */
export class HourlyStatsDto implements HourlyStats {
  @ApiProperty({ description: '시간 (0-23)', example: 14 })
  hour: number;

  @ApiProperty({ description: '해당 시간의 입장 카운트', example: 25 })
  increment: number;

  @ApiProperty({ description: '해당 시간의 퇴장 카운트', example: 18 })
  decrement: number;

  @ApiProperty({ description: '해당 시간까지의 누적 인원', example: 35 })
  total: number;
}

/**
 * 분단위 통계 DTO (Interface)
 */
export interface MinuteStats {
  /** 분 시간 (YYYY-MM-DDTHH:mm) */
  minute: string;
  /** 해당 시점까지의 현재 인원 */
  currentInside: number;
  /** 해당 시점까지의 총 입장 */
  increment: number;
  /** 해당 시점까지의 총 퇴장 */
  decrement: number;
}

/**
 * 분단위 통계 DTO (NestJS Class)
 */
export class MinuteStatsDto implements MinuteStats {
  @ApiProperty({ description: '분 시간 (YYYY-MM-DDTHH:mm)', example: '2025-01-20T14:30' })
  minute: string;

  @ApiProperty({ description: '해당 시점까지의 현재 인원', example: 35 })
  currentInside: number;

  @ApiProperty({ description: '해당 시점까지의 총 입장', example: 120 })
  increment: number;

  @ApiProperty({ description: '해당 시점까지의 총 퇴장', example: 85 })
  decrement: number;
}

/**
 * 카운트 응답 DTO (Interface)
 */
export interface CountResponse {
  /** 요청 성공 여부 */
  success: boolean;
  /** 현재 총 인원수 */
  currentTotal: number;
  /** 사용자 통계 */
  userStats: UserStats;
  /** 오늘 통계 */
  todayStats: TodayStats;
}

/**
 * 카운트 응답 DTO (NestJS Class)
 */
export class CountResponseDto implements CountResponse {
  @ApiProperty({ description: '요청 성공 여부', example: true })
  success: boolean;

  @ApiProperty({ description: '현재 총 인원수', example: 30 })
  currentTotal: number;

  @ApiProperty({ description: '사용자 통계', type: UserStatsDto })
  userStats: UserStatsDto;

  @ApiProperty({ description: '오늘 통계', type: TodayStatsDto })
  todayStats: TodayStatsDto;
}

/**
 * 통계 응답 DTO (Interface)
 */
export interface StatsResponse {
  /** UTC 기준 날짜 (YYYY-MM-DD) */
  date: string;
  /** 현재 총 인원 (입장-퇴장) */
  currentTotal: number;
  /** 오늘의 통계 */
  todayStats: TodayStats;
  /** 사용자 개인 통계 */
  userStats: UserStats;
  /** 분단위 통계 */
  minuteStats: MinuteStats[];
}

/**
 * 통계 응답 DTO (NestJS Class)
 */
export class StatsResponseDto implements StatsResponse {
  @ApiProperty({ description: 'UTC 기준 날짜 (YYYY-MM-DD)', example: '2025-01-20' })
  date: string;

  @ApiProperty({ description: '현재 총 인원 (입장-퇴장)', example: 30 })
  currentTotal: number;

  @ApiProperty({ description: '오늘의 통계', type: TodayStatsDto })
  todayStats: TodayStatsDto;

  @ApiProperty({ description: '사용자 개인 통계', type: UserStatsDto })
  userStats: UserStatsDto;

  @ApiProperty({
    description: '분단위 통계',
    type: [MinuteStatsDto],
  })
  minuteStats: MinuteStatsDto[];
}

/**
 * 통계 조회 쿼리 DTO (Interface)
 */
export interface StatsQuery {
  /** UTC 기준 날짜 (YYYY-MM-DD), 미제공시 오늘 */
  date?: string;
  /** 특정 사용자 ID, 미제공시 현재 사용자 */
  userId?: string;
}

/**
 * 통계 조회 쿼리 DTO (NestJS Class)
 */
export class StatsQueryDto implements StatsQuery {
  @ApiProperty({
    description: 'UTC 기준 날짜 (YYYY-MM-DD), 미제공시 오늘',
    required: false,
    example: '2025-01-20',
  })
  @IsOptional()
  @IsDateString({}, { message: '올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)' })
  date?: string;

  @ApiProperty({
    description: '특정 사용자 ID, 미제공시 현재 사용자',
    required: false,
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsUUID('4', { message: '올바른 UUID 형식이 아닙니다' })
  userId?: string;
}

/**
 * 히스토리 조회 쿼리 DTO (Interface)
 */
export interface HistoryQuery {
  /** 시작 날짜 (UTC, YYYY-MM-DD) */
  startDate: string;
  /** 종료 날짜 (UTC, YYYY-MM-DD) */
  endDate: string;
  /** 특정 사용자 ID, 미제공시 전체 통계 */
  userId?: string;
}

/**
 * 히스토리 조회 쿼리 DTO (NestJS Class)
 */
export class HistoryQueryDto implements HistoryQuery {
  @ApiProperty({
    description: '시작 날짜 (UTC, YYYY-MM-DD)',
    example: '2025-01-15',
  })
  @IsDateString({}, { message: '올바른 시작 날짜 형식이 아닙니다 (YYYY-MM-DD)' })
  startDate: string;

  @ApiProperty({
    description: '종료 날짜 (UTC, YYYY-MM-DD)',
    example: '2025-01-20',
  })
  @IsDateString({}, { message: '올바른 종료 날짜 형식이 아닙니다 (YYYY-MM-DD)' })
  endDate: string;

  @ApiProperty({
    description: '특정 사용자 ID, 미제공시 전체 통계',
    required: false,
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsUUID('4', { message: '올바른 UUID 형식이 아닙니다' })
  userId?: string;
}

/**
 * 히스토리 아이템 DTO (Interface)
 */
export interface HistoryItem {
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 해당 날짜의 총 입장 카운트 */
  totalIncrement: number;
  /** 해당 날짜의 총 퇴장 카운트 */
  totalDecrement: number;
  /** 해당 날짜의 순 인원 (입장-퇴장) */
  netCount: number;
  /** 해당 날짜의 최대 동시 인원 */
  maxConcurrent?: number;
}

/**
 * 히스토리 아이템 DTO (NestJS Class)
 */
export class HistoryItemDto implements HistoryItem {
  @ApiProperty({ description: '날짜 (YYYY-MM-DD)', example: '2025-01-20' })
  date: string;

  @ApiProperty({ description: '해당 날짜의 총 입장 카운트', example: 180 })
  totalIncrement: number;

  @ApiProperty({ description: '해당 날짜의 총 퇴장 카운트', example: 165 })
  totalDecrement: number;

  @ApiProperty({ description: '해당 날짜의 순 인원 (입장-퇴장)', example: 15 })
  netCount: number;

  @ApiProperty({ description: '해당 날짜의 최대 동시 인원', example: 45 })
  maxConcurrent?: number;
}

/**
 * 히스토리 응답 DTO (Interface)
 */
export interface HistoryResponse {
  /** 기간별 통계 */
  history: HistoryItem[];
  /** 요청한 기간 정보 */
  period: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };
  /** 기간 전체 통계 */
  summary: {
    totalIncrement: number;
    totalDecrement: number;
    averageDaily: number;
    peakDay: string;
    peakCount: number;
  };
}

/**
 * 히스토리 응답 DTO (NestJS Class)
 */
export class HistoryResponseDto implements HistoryResponse {
  @ApiProperty({ description: '기간별 통계', type: [HistoryItemDto] })
  history: HistoryItemDto[];

  @ApiProperty({ description: '요청한 기간 정보' })
  period: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };

  @ApiProperty({ description: '기간 전체 통계' })
  summary: {
    totalIncrement: number;
    totalDecrement: number;
    averageDaily: number;
    peakDay: string;
    peakCount: number;
  };
}
