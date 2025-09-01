'use client';

import { AuthTokens, GetUserResponse } from '@kamf/interface';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

import { apiClient } from '@/lib/api';

interface AuthUser {
  id: string;
  phoneNumber: string;
  displayName: string;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const queryClient = useQueryClient();

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
    enabled: hasToken,
    retry: false,
  });

  const user = userResponse?.user || null;

  useEffect(() => {
    if (!hasToken) {
      setIsAuthenticated(false);
      return;
    }

    if (isError) {
      // 토큰이 만료되었거나 유효하지 않은 경우
      handleLogout();
      return;
    }

    if (user) {
      setIsAuthenticated(true);
    }
  }, [user, isError, hasToken]);

  const handleLogin = (tokens: AuthTokens, userData: AuthUser) => {
    // 토큰 저장
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);

    // 캐시 업데이트
    queryClient.setQueryData(['user', 'me'], {
      data: { user: userData },
    });

    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // 토큰 제거
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // 캐시 클리어
    queryClient.clear();

    setIsAuthenticated(false);

    // 홈으로 리다이렉트
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const contextValue: AuthContextType = {
    user,
    isLoading: isLoading && hasToken, // 토큰이 있을 때만 로딩 표시
    isAuthenticated,
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
