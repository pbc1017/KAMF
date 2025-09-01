/**
 * 인증 가드 관련 hooks
 */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth, AuthUser } from '@/providers/AuthProvider';

/**
 * 인증이 필요한 페이지에서 사용하는 가드 훅
 * 인증되지 않은 사용자를 로그인 페이지로 리다이렉트
 */
export function useRequireAuth() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return { isAuthenticated, isLoading };
}

/**
 * 인증된 사용자를 홈으로 리다이렉트하는 가드 훅
 * 로그인 페이지에서 사용
 */
export function useRedirectIfAuthenticated(redirectTo: string = '/') {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
}

/**
 * 인증 상태에 따른 조건부 렌더링 컴포넌트
 */
export function useAuthState(): {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthenticating: boolean;
  isGuest: boolean;
} {
  const { user, isAuthenticated, isLoading } = useAuth();

  return {
    user,
    isAuthenticated,
    isLoading,
    isAuthenticating: isLoading,
    isGuest: !isLoading && !isAuthenticated,
  };
}
