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

// 로그아웃 함수는 AuthProvider에서 제공합니다.
// useAuth 훅에서 로그아웃을 사용하려면: const { logout } = useAuth();
