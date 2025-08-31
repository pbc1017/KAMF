import { ApiProperty } from '@nestjs/swagger';

import { User } from '../../entities/user.entity.js';

export class ApiResponseDto<T = any> {
  @ApiProperty({ description: '요청 성공 여부' })
  success: boolean;

  @ApiProperty({ description: '응답 데이터', required: false })
  data?: T;

  @ApiProperty({ description: '에러 메시지', required: false })
  error?: string;
}

export class ErrorResponseDto {
  @ApiProperty({ description: '요청 성공 여부', example: false })
  success: false;

  @ApiProperty({ description: '에러 메시지' })
  error: string;
}

// Auth 응답 DTOs
export class MessageResponseDto {
  @ApiProperty({ description: '성공 여부' })
  success: boolean;

  @ApiProperty({
    description: '응답 데이터',
    type: 'object',
    properties: {
      message: { type: 'string', description: '응답 메시지' },
    },
  })
  data: { message: string };
}

export class AuthResponseDto {
  @ApiProperty({ description: '성공 여부' })
  success: boolean;

  @ApiProperty({
    description: '인증 응답 데이터',
    type: 'object',
    properties: {
      user: { $ref: '#/components/schemas/User' },
      tokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
        },
      },
    },
  })
  data: { user: User; tokens: { accessToken: string; refreshToken: string } };
}

// User 응답 DTOs
export class UserResponseDto {
  @ApiProperty({ description: '성공 여부' })
  success: boolean;

  @ApiProperty({ type: User })
  data: { user: User };
}

export class UsersResponseDto {
  @ApiProperty({ description: '성공 여부' })
  success: boolean;

  @ApiProperty({ type: [User] })
  data: { users: User[] };
}

export class UserStatsResponseDto {
  @ApiProperty({ description: '성공 여부' })
  success: boolean;

  @ApiProperty({
    description: '사용자 통계 데이터',
    type: 'object',
    properties: {
      totalUsers: { type: 'number' },
      roleStats: { type: 'object' },
    },
  })
  data: { totalUsers: number; roleStats: Record<string, number> };
}
