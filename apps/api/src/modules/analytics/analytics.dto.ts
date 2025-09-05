import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class TrackVisitorDto {
  @ApiProperty({ description: '첫 방문한 페이지 경로', example: '/' })
  @IsString()
  landingPage: string;

  @ApiProperty({ description: '사용자 에이전트', example: 'Mozilla/5.0...', required: false })
  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class TrackVisitorResponseDto {
  @ApiProperty({ description: '추적 성공 여부' })
  success: boolean;

  @ApiProperty({ description: '메시지', required: false })
  message?: string;
}
