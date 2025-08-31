import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';

import { User } from '../../entities/user.entity.js';

export interface TokenPayload {
  iat?: number;
  exp?: number;
  userId: string;
  phoneNumber: string;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class JwtAuthService {
  constructor(private configService: ConfigService) {}

  /**
   * Access Token과 Refresh Token 쌍 생성
   * @param user 사용자 엔티티 (roles 포함)
   * @returns 토큰 쌍과 만료 시간
   */
  generateTokens(user: User): AuthTokens {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      userId: user.id,
      phoneNumber: user.phoneNumber,
      roles: user.roles.map(role => role.name),
    };

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtRefreshSecret = this.configService.get<string>('REFRESH_TOKEN_SECRET');

    if (!jwtSecret || !jwtRefreshSecret) {
      throw new Error('JWT secrets not configured');
    }

    const accessToken = jwt.sign(payload, jwtSecret, {
      expiresIn: '1h', // 1시간
    });

    const refreshToken = jwt.sign(payload, jwtRefreshSecret, {
      expiresIn: '7d', // 7일
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1시간 = 3600초
    };
  }

  /**
   * Access Token 검증
   * @param token JWT 토큰
   * @returns 디코딩된 페이로드
   * @throws UnauthorizedException 토큰이 유효하지 않은 경우
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        throw new Error('JWT secret not configured');
      }

      return jwt.verify(token, jwtSecret) as TokenPayload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Access token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid access token');
      }
      throw new UnauthorizedException('Token verification failed');
    }
  }

  /**
   * Refresh Token 검증
   * @param token Refresh JWT 토큰
   * @returns 디코딩된 페이로드
   * @throws UnauthorizedException 토큰이 유효하지 않은 경우
   */
  verifyRefreshToken(token: string): TokenPayload {
    try {
      const jwtRefreshSecret = this.configService.get<string>('REFRESH_TOKEN_SECRET');
      if (!jwtRefreshSecret) {
        throw new Error('JWT refresh secret not configured');
      }

      return jwt.verify(token, jwtRefreshSecret) as TokenPayload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid refresh token');
      }
      throw new UnauthorizedException('Refresh token verification failed');
    }
  }

  /**
   * Refresh Token을 사용하여 새 Access Token 발급
   * @param user 사용자 엔티티 (최신 정보)
   * @returns 새 토큰 쌍
   */
  refreshTokens(user: User): AuthTokens {
    // 기존 generateTokens 메서드 재사용
    return this.generateTokens(user);
  }

  /**
   * Authorization 헤더에서 Bearer 토큰 추출
   * @param authHeader Authorization 헤더 값
   * @returns 추출된 JWT 토큰
   * @throws UnauthorizedException 헤더 형식이 잘못된 경우
   */
  extractTokenFromHeader(authHeader: string): string {
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    return token;
  }

  /**
   * 토큰 만료 시간까지 남은 시간 계산
   * @param token JWT 토큰
   * @returns 남은 시간 (초)
   */
  getTimeToExpiry(token: string): number {
    try {
      const decoded = this.verifyAccessToken(token);
      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, (decoded.exp || 0) - now);
    } catch {
      return 0;
    }
  }
}
