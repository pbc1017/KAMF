import type {
  GetUserResponse,
  GetUsersResponse,
  UpdateUserResponse,
} from '@kamf/interface/types/api.js';
import { ApiResponse } from '@kamf/interface/types/common.js';
import { UserRole } from '@kamf/interface/types/user.js';
import { Controller, Get, Patch, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import {
  mapUserEntityToInterface,
  mapUserEntitiesToInterfaces,
} from '../../common/utils/user.mapper.js';

import { UserService } from './users.service.js';

interface AuthenticatedUser {
  id: string;
  phoneNumber: string;
  roles: { name: string }[];
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private userService: UserService) {}

  /**
   * 내 정보 조회
   * GET /api/users/me
   * 권한: 모든 인증된 사용자
   */
  @Get('me')
  @Roles(UserRole.USER, UserRole.BOOTH, UserRole.SAFETY, UserRole.ADMIN)
  async getMe(
    @CurrentUser() currentUser: AuthenticatedUser
  ): Promise<ApiResponse<GetUserResponse>> {
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
  @Patch('me')
  @Roles(UserRole.USER, UserRole.BOOTH, UserRole.SAFETY, UserRole.ADMIN)
  async updateMe(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: { displayName: string }
  ): Promise<ApiResponse<UpdateUserResponse>> {
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
  @Get()
  @Roles(UserRole.ADMIN)
  async getUsers(): Promise<ApiResponse<GetUsersResponse>> {
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
  @Get(':id')
  @Roles(UserRole.ADMIN)
  async getUser(@Param('id') userId: string): Promise<ApiResponse<GetUserResponse>> {
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
  @Patch(':id/roles')
  @Roles(UserRole.ADMIN)
  async updateUserRoles(
    @Param('id') userId: string,
    @Body() body: { roles: UserRole[] }
  ): Promise<ApiResponse<UpdateUserResponse>> {
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
  @Get('role/:role')
  @Roles(UserRole.ADMIN)
  async getUsersByRole(@Param('role') role: string): Promise<ApiResponse<GetUsersResponse>> {
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
   * GET /api/users/stats
   * 권한: ADMIN만
   */
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
