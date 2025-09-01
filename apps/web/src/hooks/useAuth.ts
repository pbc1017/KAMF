/**
 * Authentication related hooks
 */

import {
  AuthRequest,
  VerifyCodeRequest,
  AuthResponse,
  RefreshTokenRequest,
  RequestCodeResponse,
} from '@kamf/interface';
import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';

// 인증번호 요청 hook
export function useRequestCode() {
  return useMutation({
    mutationFn: (data: AuthRequest) =>
      apiClient<{ data: RequestCodeResponse }>('auth/request-code', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

// 인증번호 확인 & 로그인 hook
export function useVerifyCode() {
  return useMutation({
    mutationFn: (data: VerifyCodeRequest) =>
      apiClient<{ data: AuthResponse }>('auth/verify', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

// 토큰 갱신 hook
export function useRefreshToken() {
  return useMutation({
    mutationFn: (data: RefreshTokenRequest) =>
      apiClient<{ data: AuthResponse }>('auth/refresh', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

// 로그아웃 유틸리티 함수 (hook이 필요 없는 간단한 작업)
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/';
  }
}
