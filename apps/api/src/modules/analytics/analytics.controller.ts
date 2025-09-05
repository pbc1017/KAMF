import { Controller, Post, Body, Req, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

import { TrackVisitorDto, TrackVisitorResponseDto } from './analytics.dto.js';
import { AnalyticsService } from './analytics.service.js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
}

@ApiTags('분석 (Analytics)')
@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({
    summary: '방문자 추적',
    description:
      '사용자의 첫 방문 페이지를 추적합니다. 로그인 상태에 따라 사용자 정보도 함께 저장됩니다.',
  })
  @ApiOkResponse({
    description: '방문자 추적 성공',
    type: TrackVisitorResponseDto,
  })
  @ApiBearerAuth() // 선택적 인증 (로그인 안 해도 됨)
  @Post('track')
  @HttpCode(HttpStatus.OK)
  async trackVisitor(
    @Body() trackVisitorDto: TrackVisitorDto,
    @Req() req: AuthenticatedRequest
  ): Promise<TrackVisitorResponseDto> {
    try {
      // 로그인된 사용자인 경우 userId 추출, 아니면 null
      const userId = req.user?.id || null;

      // 방문자 추적 데이터 저장
      await this.analyticsService.trackVisitor(trackVisitorDto, userId);

      this.logger.log(`Visitor tracking successful: ${trackVisitorDto.landingPage}`);

      return {
        success: true,
        message: 'Visitor tracking completed successfully',
      };
    } catch (error) {
      this.logger.error(`Visitor tracking failed: ${error.message}`, error.stack);

      return {
        success: false,
        message: 'Visitor tracking failed',
      };
    }
  }
}
