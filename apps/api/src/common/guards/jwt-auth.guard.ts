import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { JwtAuthService } from '../../modules/auth/jwt.service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtAuthService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    try {
      // Bearer 토큰 추출
      const token = this.jwtService.extractTokenFromHeader(authHeader);

      // 토큰 검증 및 페이로드 추출
      const payload = this.jwtService.verifyAccessToken(token);

      // 사용자 정보를 request 객체에 첨부 (roles.guard.ts에서 사용)
      request.user = {
        id: payload.userId,
        phoneNumber: payload.phoneNumber,
        roles: payload.roles.map(roleName => ({ name: roleName })),
      };

      return true;
    } catch (error) {
      // JWT 서비스에서 던진 구체적인 에러 메시지 사용
      throw error instanceof UnauthorizedException
        ? error
        : new UnauthorizedException('Invalid authentication token');
    }
  }
}
