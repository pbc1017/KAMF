/**
 * Authentication related hooks
 */

import {
  AuthRequest,
  VerifyCodeRequest,
  AuthResponse,
  RequestCodeResponse,
} from '@kamf/interface/dtos/auth.dto.js';
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

// 토큰 갱신 hook (HTTP-only 쿠키 사용)
export function useRefreshToken() {
  return useMutation({
    mutationFn: () =>
      apiClient<{ data: AuthResponse }>('auth/refresh', {
        method: 'POST',
        credentials: 'include', // HTTP-only 쿠키 자동 전송
      }),
  });
}

// 로그아웃 유틸리티 함수 (hook이 필요 없는 간단한 작업)
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    // refreshToken localStorage 제거 로직 삭제 - 서버에서 쿠키 관리

    // 서버에 로그아웃 요청 (쿠키 클리어)
    apiClient('auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
      .catch(error => {
        console.error('Logout request failed:', error);
      })
      .finally(() => {
        window.location.href = '/';
      });
  }
}
