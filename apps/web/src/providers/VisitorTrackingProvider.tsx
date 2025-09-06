'use client';

import { ReactNode } from 'react';

import { useVisitorTracking } from '@/hooks/useVisitorTracking';

interface VisitorTrackingProviderProps {
  children: ReactNode;
}

/**
 * 방문자 추적 프로바이더
 * 앱 전체에서 자동으로 방문자 추적을 수행합니다.
 */
export function VisitorTrackingProvider({ children }: VisitorTrackingProviderProps) {
  // 자동으로 방문자 추적을 시작
  const trackingState = useVisitorTracking();

  // 개발 환경에서 추적 상태를 콘솔에 출력
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // 추적 상태가 변경될 때마다 로깅 (단, 너무 자주 출력되지 않도록 조절)
    if (trackingState.isTracking) {
      console.log('🔄 VisitorTrackingProvider: Tracking in progress...');
    } else if (trackingState.isTracked) {
      console.log('✅ VisitorTrackingProvider: Visitor tracking completed');
    } else if (trackingState.trackingError) {
      console.warn('❌ VisitorTrackingProvider: Tracking error:', trackingState.trackingError);
    }
  }

  // 추적 상태와 관계없이 children을 렌더링
  // 추적은 백그라운드에서 수행되며 UI에 영향을 주지 않음
  return <>{children}</>;
}

/**
 * 개발 환경 전용: 추적 상태 디버깅 컴포넌트
 */
function VisitorTrackingDebugInfo() {
  const trackingState = useVisitorTracking();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 10000,
        fontFamily: 'monospace',
        opacity: trackingState.isTracking || trackingState.trackingError ? 1 : 0.3,
      }}
    >
      <div>🎯 Visitor Tracking</div>
      <div>First Visit: {trackingState.isFirstVisit ? '✅' : '❌'}</div>
      <div>Tracking: {trackingState.isTracking ? '🔄' : '💤'}</div>
      <div>Tracked: {trackingState.isTracked ? '✅' : '❌'}</div>
      {trackingState.trackingError && (
        <div style={{ color: '#ff6b6b' }}>Error: {trackingState.trackingError.message}</div>
      )}
    </div>
  );
}

/**
 * 디버그 정보를 포함한 방문자 추적 프로바이더 (개발용)
 */
export function VisitorTrackingProviderWithDebug({ children }: VisitorTrackingProviderProps) {
  return (
    <VisitorTrackingProvider>
      {children}
      <VisitorTrackingDebugInfo />
    </VisitorTrackingProvider>
  );
}
