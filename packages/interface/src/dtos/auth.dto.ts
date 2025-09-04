/**
 * Authentication related DTOs (Data Transfer Objects)
 */

import { AuthTokens } from '../types/auth.type.js';
import { ApiResponse } from '../types/common.type.js';

export interface AuthRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    roles: string[];
  };
  tokens: AuthTokens;
}

// RefreshTokenRequest 제거 - 더 이상 필요 없음 (쿠키로 처리)

export interface RequestCodeResponse {
  message: string;
}

// 에러 타입 정의
export type AuthErrorCode = 'INVALID_TOKEN' | 'NETWORK_ERROR' | 'PARSE_ERROR' | 'EXPIRED_TOKEN';

export class AuthError extends Error {
  constructor(
    message: string,
    public code: AuthErrorCode
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// 타입 가드 함수들
export function isValidAuthResponse(data: any): data is ApiResponse<AuthResponse> {
  return (
    data?.success === true &&
    data?.data &&
    data?.data?.tokens?.accessToken &&
    typeof data.data.tokens.accessToken === 'string' &&
    typeof data.data.tokens.expiresIn === 'number'
  );
}

export function isValidApiResponse<T>(data: any): data is ApiResponse<T> {
  return data?.success === true && data?.data;
}

// Legacy types (keeping for compatibility)
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
  tokens: AuthTokens;
}
