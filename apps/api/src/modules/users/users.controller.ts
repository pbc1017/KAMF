import { ApiResponse } from '@kamf/interface/types/common.js';
import { UserRole } from '@kamf/interface/types/user.js';
import { Controller, Get, Patch, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import {
  UserResponseDto,
  UsersResponseDto,
  UserStatsResponseDto,
} from '../../common/dto/common.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import {
  mapUserEntityToInterface,
  mapUserEntitiesToInterfaces,
} from '../../common/utils/user.mapper.js';

import { UpdateDisplayNameDto, UpdateUserRolesDto } from './users.dto.js';
import { UserService } from './users.service.js';

interface AuthenticatedUser {
  id: string;
  phoneNumber: string;
  roles: { name: string }[];
}

@ApiTags('사용자 관리 (Users)')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private userService: UserService) {}

  /**
   * 내 정보 조회
   * GET /api/users/me
   * 권한: 모든 인증된 사용자
   */
  @ApiOperation({
    summary: '내 정보 조회',
    description: '현재 로그인한 사용자의 정보를 조회합니다.',
  })
  @ApiOkResponse({
    description: '사용자 정보 조회 성공',
    type: UserResponseDto,
  })
  @Get('me')
  @Roles(UserRole.USER, UserRole.BOOTH, UserRole.SAFETY, UserRole.ADMIN)
  async getMe(
    @CurrentUser() currentUser: AuthenticatedUser
  ): Promise<ApiResponse<{ user: object }>> {
    const user = await this.userService.findById(currentUser.id);

    if (!user) {
      throw new ForbiddenException('사용자 정보를 찾을 수 없습니다');
    }

    return {
      success: true,
      data: { user: mapUserEntityToInterface(user) },
    };
  }

  /**
   * 내 정보 수정 (이름 변경)
   * PATCH /api/users/me
   * 권한: 모든 인증된 사용자
   */
  @ApiOperation({
    summary: '내 정보 수정',
    description: '현재 로그인한 사용자의 표시 이름을 수정합니다.',
  })
  @ApiBody({ type: UpdateDisplayNameDto })
  @ApiOkResponse({
    description: '사용자 정보 수정 성공',
    type: UserResponseDto,
  })
  @Patch('me')
  @Roles(UserRole.USER, UserRole.BOOTH, UserRole.SAFETY, UserRole.ADMIN)
  async updateMe(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: { displayName: string }
  ): Promise<ApiResponse<{ user: object }>> {
    if (!body.displayName || typeof body.displayName !== 'string') {
      throw new ForbiddenException('유효한 이름을 입력해주세요');
    }

    if (body.displayName.trim().length === 0 || body.displayName.length > 50) {
      throw new ForbiddenException('이름은 1-50자 사이여야 합니다');
    }

    const updatedUser = await this.userService.updateDisplayName(
      currentUser.id,
      body.displayName.trim()
    );

    return {
      success: true,
      data: { user: mapUserEntityToInterface(updatedUser) },
    };
  }

  /**
   * 전체 사용자 조회
   * GET /api/users
   * 권한: ADMIN만
   */
  @ApiOperation({
    summary: '전체 사용자 조회',
    description: '시스템의 모든 사용자 정보를 조회합니다. (관리자 전용)',
  })
  @ApiOkResponse({
    description: '사용자 목록 조회 성공',
    type: UsersResponseDto,
  })
  @Get()
  @Roles(UserRole.ADMIN)
  async getUsers(): Promise<ApiResponse<{ users: object[] }>> {
    const users = await this.userService.findAll();

    return {
      success: true,
      data: { users: mapUserEntitiesToInterfaces(users) },
    };
  }

  /**
   * 특정 사용자 정보 조회
   * GET /api/users/:id
   * 권한: ADMIN만
   */
  @ApiOperation({
    summary: '특정 사용자 정보 조회',
    description: 'ID로 특정 사용자의 정보를 조회합니다. (관리자 전용)',
  })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiOkResponse({
    description: '사용자 정보 조회 성공',
    type: UserResponseDto,
  })
  @Get(':id')
  @Roles(UserRole.ADMIN)
  async getUser(@Param('id') userId: string): Promise<ApiResponse<{ user: object }>> {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new ForbiddenException('사용자를 찾을 수 없습니다');
    }

    return {
      success: true,
      data: { user: mapUserEntityToInterface(user) },
    };
  }

  /**
   * 사용자 역할 관리
   * PATCH /api/users/:id/roles
   * 권한: ADMIN만
   */
  @ApiOperation({
    summary: '사용자 역할 수정',
    description: '특정 사용자의 역할을 수정합니다. (관리자 전용)',
  })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiBody({ type: UpdateUserRolesDto })
  @ApiOkResponse({
    description: '사용자 역할 수정 성공',
    type: UserResponseDto,
  })
  @Patch(':id/roles')
  @Roles(UserRole.ADMIN)
  async updateUserRoles(
    @Param('id') userId: string,
    @Body() body: { roles: UserRole[] }
  ): Promise<ApiResponse<{ user: object }>> {
    if (!Array.isArray(body.roles) || body.roles.length === 0) {
      throw new ForbiddenException('최소 하나의 역할을 지정해야 합니다');
    }

    // 유효한 역할인지 확인
    const validRoles = Object.values(UserRole);
    const invalidRoles = body.roles.filter(role => !validRoles.includes(role));

    if (invalidRoles.length > 0) {
      throw new ForbiddenException(`유효하지 않은 역할: ${invalidRoles.join(', ')}`);
    }

    const updatedUser = await this.userService.updateUserRoles(userId, body.roles);

    return {
      success: true,
      data: { user: mapUserEntityToInterface(updatedUser) },
    };
  }

  /**
   * 역할별 사용자 조회
   * GET /api/users/role/:role
   * 권한: ADMIN만
   */
  @ApiOperation({
    summary: '역할별 사용자 조회',
    description: '특정 역할을 가진 사용자들을 조회합니다. (관리자 전용)',
  })
  @ApiParam({
    name: 'role',
    description: '사용자 역할',
    enum: UserRole,
  })
  @ApiOkResponse({
    description: '역할별 사용자 조회 성공',
    type: UsersResponseDto,
  })
  @Get('role/:role')
  @Roles(UserRole.ADMIN)
  async getUsersByRole(@Param('role') role: string): Promise<ApiResponse<{ users: object[] }>> {
    // 유효한 역할인지 확인
    if (!Object.values(UserRole).includes(role as UserRole)) {
      throw new ForbiddenException('유효하지 않은 역할입니다');
    }

    const users = await this.userService.findByRole(role as UserRole);

    return {
      success: true,
      data: { users: mapUserEntitiesToInterfaces(users) },
    };
  }

  /**
   * 사용자 통계 조회
   * GET /api/users/stats/summary
   * 권한: ADMIN만
   */
  @ApiOperation({
    summary: '사용자 통계 조회',
    description: '전체 사용자 수와 역할별 사용자 통계를 조회합니다. (관리자 전용)',
  })
  @ApiOkResponse({
    description: '사용자 통계 조회 성공',
    type: UserStatsResponseDto,
  })
  @Get('stats/summary')
  @Roles(UserRole.ADMIN)
  async getUserStats(): Promise<
    ApiResponse<{
      totalUsers: number;
      roleStats: Record<string, number>;
    }>
  > {
    const stats = await this.userService.getUserStats();

    return {
      success: true,
      data: stats,
    };
  }
}
