'use client';

import { AuthTokens, GetUserResponse } from '@kamf/interface';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

import { apiClient, setTokens, clearTokens } from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  roles: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (tokens: AuthTokens, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // 초기 상태: 토큰이 있으면 로그인된 것으로 간주
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('accessToken');
    }
    return false;
  });
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();

  // 클라이언트에서 마운트되었는지 확인
  useEffect(() => {
    setMounted(true);
  }, []);

  // 토큰이 있는지 확인
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');

  // 토큰이 있으면 사용자 정보 조회
  const {
    data: userResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => apiClient<GetUserResponse>('users/me'),
    enabled: hasToken && mounted, // 마운트된 후에만 실행
    retry: false,
  });

  const user = userResponse?.data?.user || null;

  useEffect(() => {
    // 마운트되지 않은 경우 처리 안함
    if (!mounted) {
      return;
    }

    // 토큰이 없으면 로그아웃
    if (!hasToken) {
      setIsAuthenticated(false);
      return;
    }

    // API 에러가 발생한 경우 (토큰 만료 등)
    if (isError) {
      handleLogout();
      return;
    }

    // 토큰은 있지만 아직 사용자 정보를 불러오는 중인 경우
    // 이미 토큰 기반으로 true로 설정되어 있으므로 그대로 유지
  }, [isError, hasToken, mounted]);

  const handleLogin = (tokens: AuthTokens, userData: AuthUser) => {
    // 토큰 저장 (api.ts의 토큰 관리 함수 사용)
    setTokens(tokens.accessToken, tokens.refreshToken);

    // 캐시 업데이트 - API 응답 구조에 맞게 설정
    queryClient.setQueryData(['user', 'me'], {
      success: true,
      data: { user: userData },
    });

    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // 토큰 제거 (api.ts의 토큰 관리 함수 사용)
    clearTokens();

    // 캐시 클리어
    queryClient.clear();

    setIsAuthenticated(false);

    // 홈으로 리다이렉트
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  // 전역 로그아웃 이벤트 리스너 등록
  useEffect(() => {
    const handleAuthLogout = () => {
      console.log('Auth logout event received');
      handleLogout();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:logout', handleAuthLogout);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth:logout', handleAuthLogout);
      }
    };
  }, []);

  const contextValue: AuthContextType = {
    user,
    isLoading: !mounted || (isLoading && hasToken), // 마운트되지 않았거나 로딩 중
    isAuthenticated: mounted && isAuthenticated, // 마운트된 후에만 인증됨으로 표시
    login: handleLogin,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
