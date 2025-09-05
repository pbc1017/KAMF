import { useEffect, useState } from 'react';

import { VisitorTracker } from '@/utils/visitor-tracking';

/**
 * 방문자 추적 훅
 * 컴포넌트가 마운트될 때 자동으로 방문자 추적을 시도합니다.
 */
export function useVisitorTracking() {
  // 초기 상태를 로컬스토리지 기반으로 설정
  const [isTracking, setIsTracking] = useState(false);
  const [isTracked, setIsTracked] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !VisitorTracker.isFirstVisit(); // 첫 방문이 아니면 이미 추적된 것
  });
  const [trackingError, setTrackingError] = useState<Error | null>(null);

  useEffect(() => {
    const trackVisitor = async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 useVisitorTracking: Starting tracking check', {
          isFirstVisit: VisitorTracker.isFirstVisit(),
          isTracking,
          isTracked,
        });
      }

      // 첫 방문자가 아니면 추적하지 않음 (localStorage 체크)
      if (!VisitorTracker.isFirstVisit()) {
        if (!isTracked) {
          setIsTracked(true);
        }
        if (process.env.NODE_ENV === 'development') {
          console.log('🚫 useVisitorTracking: Skipping - not first visit');
        }
        return;
      }

      // 이미 추적 중이거나 완료된 경우 중복 실행 방지
      if (isTracking || isTracked) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🚫 useVisitorTracking: Skipping - already tracking or tracked');
        }
        return;
      }

      setIsTracking(true);
      setTrackingError(null);

      try {
        const success = await VisitorTracker.trackCurrentPage();
        setIsTracked(true); // API 성공/실패와 관계없이 추적 완료로 표시

        if (!success) {
          setTrackingError(new Error('Tracking API returned false'));
        }
      } catch (error) {
        setIsTracked(true); // 에러가 발생해도 추적 완료로 표시하여 재시도 방지
        setTrackingError(error instanceof Error ? error : new Error('Unknown tracking error'));
      } finally {
        setIsTracking(false);
      }
    };

    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      // 페이지 로드 후 약간의 지연을 두어 다른 중요한 로딩이 완료된 후 실행
      const timeoutId = setTimeout(trackVisitor, 100);

      return () => clearTimeout(timeoutId);
    }
  }, []); // 빈 의존성 배열로 변경 - 컴포넌트 마운트 시에만 실행

  return {
    isTracking, // 현재 추적 중인지
    isTracked, // 추적이 완료되었는지
    trackingError, // 추적 중 발생한 에러
    isFirstVisit: VisitorTracker.isFirstVisit(), // 첫 방문자인지
  };
}

/**
 * 수동 방문자 추적 훅
 * 특정 시점에 수동으로 추적을 실행하고 싶을 때 사용합니다.
 */
export function useManualVisitorTracking() {
  const [isTracking, setIsTracking] = useState(false);
  const [lastResult, setLastResult] = useState<boolean | null>(null);
  const [trackingError, setTrackingError] = useState<Error | null>(null);

  const trackVisitor = async (landingPage?: string) => {
    setIsTracking(true);
    setTrackingError(null);
    setLastResult(null);

    try {
      const success = landingPage
        ? await VisitorTracker.trackVisitor(landingPage)
        : await VisitorTracker.trackCurrentPage();

      setLastResult(success);
      return success;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown tracking error');
      setTrackingError(errorObj);
      throw errorObj;
    } finally {
      setIsTracking(false);
    }
  };

  const resetTracking = () => {
    VisitorTracker.resetTracking();
    setLastResult(null);
    setTrackingError(null);
  };

  return {
    trackVisitor,
    resetTracking,
    isTracking,
    lastResult,
    trackingError,
    isFirstVisit: VisitorTracker.isFirstVisit(),
  };
}
