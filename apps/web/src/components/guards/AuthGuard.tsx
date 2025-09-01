/**
 * 인증 가드 컴포넌트
 */

'use client';

import { ReactNode } from 'react';

import { FullScreenLoading } from '@/components/ui/LoadingSpinner';
import { useAuthState } from '@/hooks/useAuthGuard';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
  redirectIfAuthenticated?: boolean;
  redirectTo?: string;
}

/**
 * 조건부 렌더링 기반 인증 가드 컴포넌트
 * - requireAuth: true일 때 인증된 사용자만 children 표시
 * - redirectIfAuthenticated: true일 때 인증된 사용자에게는 fallback 표시
 */
export default function AuthGuard({
  children,
  fallback = <FullScreenLoading />,
  requireAuth = false,
  redirectIfAuthenticated = false,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuthState();

  // 로딩 중에는 fallback 표시
  if (isLoading) {
    return <>{fallback}</>;
  }

  // 인증이 필요한 경우: 인증되지 않으면 fallback 표시
  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  // 인증된 사용자를 리다이렉트해야 하는 경우: 인증되면 fallback 표시
  if (redirectIfAuthenticated && isAuthenticated) {
    return <>{fallback}</>;
  }

  // 조건을 모두 통과하면 children 렌더링
  return <>{children}</>;
}

/**
 * 인증이 필요한 페이지용 가드 컴포넌트
 */
export function RequireAuthGuard({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <AuthGuard requireAuth={true} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

/**
 * 인증된 사용자를 리다이렉트하는 가드 컴포넌트
 */
export function GuestOnlyGuard({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <AuthGuard redirectIfAuthenticated={true} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}
