import {
  CountRequestDto,
  CountResponseDto,
  StatsResponseDto,
  StatsQueryDto,
  HistoryQueryDto,
  HistoryResponseDto,
} from '@kamf/interface';
import { UserRole } from '@kamf/interface/types/user.type.js';
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

import { SafetyService } from './safety.service.js';

@ApiTags('Safety')
@Controller('safety')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Post('count')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SAFETY)
  @ApiOperation({
    summary: '안전 카운트 업데이트',
    description: '입장 또는 퇴장 카운트를 증가시킵니다. SAFETY 역할이 필요합니다.',
  })
  @ApiBody({ type: CountRequestDto })
  @ApiResponse({
    status: 200,
    description: '카운트 업데이트 성공',
    type: CountResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (유효하지 않은 카운트 값 등)',
  })
  @ApiResponse({
    status: 403,
    description: 'SAFETY 역할이 필요합니다',
  })
  @ApiResponse({
    status: 409,
    description: '동시성 충돌로 인한 재시도 필요',
  })
  async updateCount(
    @CurrentUser('id') userId: string,
    @Body(ValidationPipe) request: CountRequestDto
  ): Promise<CountResponseDto> {
    return this.safetyService.updateCount(userId, request);
  }

  @Get('stats')
  @Roles(UserRole.SAFETY)
  @ApiOperation({
    summary: '안전 통계 조회',
    description: '현재 안전 통계를 조회합니다. 일별, 시간별 통계와 개인 통계를 포함합니다.',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'UTC 날짜 (YYYY-MM-DD), 미제공시 오늘',
    example: '2025-01-20',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: '특정 사용자 ID, 미제공시 현재 사용자',
  })
  @ApiResponse({
    status: 200,
    description: '통계 조회 성공',
    type: StatsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 날짜 형식',
  })
  @ApiResponse({
    status: 403,
    description: 'SAFETY 역할이 필요합니다',
  })
  async getStats(
    @CurrentUser('id') currentUserId: string,
    @Query(ValidationPipe) query: StatsQueryDto
  ): Promise<StatsResponseDto> {
    const userId = query.userId || currentUserId;
    return this.safetyService.getStats(userId, query.date);
  }

  @Get('history')
  @Roles(UserRole.SAFETY)
  @ApiOperation({
    summary: '안전 히스토리 조회',
    description: '지정된 기간의 안전 통계 히스토리를 조회합니다. 최대 90일까지 조회 가능합니다.',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: '시작 날짜 (YYYY-MM-DD)',
    example: '2025-01-15',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: '종료 날짜 (YYYY-MM-DD)',
    example: '2025-01-20',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: '특정 사용자 ID, 미제공시 전체 통계',
  })
  @ApiResponse({
    status: 200,
    description: '히스토리 조회 성공',
    type: HistoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 날짜 형식 또는 범위',
  })
  @ApiResponse({
    status: 403,
    description: 'SAFETY 역할이 필요합니다',
  })
  async getHistory(@Query(ValidationPipe) query: HistoryQueryDto): Promise<HistoryResponseDto> {
    return this.safetyService.getHistory(query.startDate, query.endDate, query.userId);
  }

  @Get('health')
  @Roles(UserRole.SAFETY, UserRole.ADMIN)
  @ApiOperation({
    summary: '시스템 상태 확인',
    description: '안전 관리 시스템의 상태를 확인합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '시스템 상태 조회 성공',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        recentActivity: { type: 'boolean', example: true },
        currentDate: { type: 'string', example: '2025-01-20' },
        totalToday: { type: 'number', example: 45 },
      },
    },
  })
  async getHealthStatus() {
    return this.safetyService.getHealthStatus();
  }

  // 관리자 전용 엔드포인트들
  @Post('admin/reset-user')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[관리자] 사용자 데이터 초기화',
    description: '특정 사용자의 모든 안전 카운트 데이터를 삭제합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', format: 'uuid' },
      },
      required: ['userId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '사용자 데이터 초기화 성공',
  })
  @ApiResponse({
    status: 403,
    description: 'ADMIN 역할이 필요합니다',
  })
  async resetUserData(@Body('userId', ParseUUIDPipe) userId: string) {
    return this.safetyService.resetUserData(userId);
  }

  @Post('admin/reset-date')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[관리자] 날짜별 데이터 초기화',
    description: '특정 날짜의 모든 안전 카운트 데이터를 삭제합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        date: { type: 'string', format: 'date', example: '2025-01-20' },
      },
      required: ['date'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '날짜별 데이터 초기화 성공',
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 날짜 형식',
  })
  @ApiResponse({
    status: 403,
    description: 'ADMIN 역할이 필요합니다',
  })
  async resetDateData(@Body('date') date: string) {
    return this.safetyService.resetDateData(date);
  }
}
