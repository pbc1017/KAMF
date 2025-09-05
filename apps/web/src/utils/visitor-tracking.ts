import { TrackVisitorRequest, TrackVisitorResponse } from '@kamf/interface/dtos/analytics.dto.js';

import { apiClient } from '@/lib/api';

/**
 * 방문자 추적 관리 클래스
 */
export class VisitorTracker {
  private static readonly STORAGE_KEY = 'kamf_visitor_tracked';
  private static readonly DEBUG = process.env.NODE_ENV === 'development';
  private static trackingPromise: Promise<boolean> | null = null;

  /**
   * 첫 방문자인지 확인
   * @returns 첫 방문자 여부
   */
  static isFirstVisit(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const hasVisited = localStorage.getItem(this.STORAGE_KEY);
      const isFirst = !hasVisited || hasVisited !== 'true';

      if (this.DEBUG) {
        console.log('🔍 VisitorTracker: localStorage check -', {
          key: this.STORAGE_KEY,
          value: hasVisited,
          isFirstVisit: isFirst,
        });
      }

      return isFirst;
    } catch (error) {
      console.warn('⚠️ VisitorTracker: localStorage access failed', error);
      return false; // localStorage 접근 실패시 추적하지 않음
    }
  }

  /**
   * 방문 추적 완료로 표시
   */
  static markAsTracked(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.STORAGE_KEY, 'true');

      if (this.DEBUG) {
        console.log('✅ VisitorTracker: Marked as tracked');
      }
    } catch (error) {
      console.warn('⚠️ VisitorTracker: Failed to mark as tracked', error);
    }
  }

  /**
   * 추적 상태 초기화 (개발/테스트용)
   */
  static resetTracking(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.STORAGE_KEY);

      if (this.DEBUG) {
        console.log('🔄 VisitorTracker: Tracking reset');
      }
    } catch (error) {
      console.warn('⚠️ VisitorTracker: Failed to reset tracking', error);
    }
  }

  /**
   * 방문자 추적 실행
   * @param landingPage 첫 방문 페이지 경로
   * @returns 추적 성공 여부
   */
  static async trackVisitor(landingPage: string): Promise<boolean> {
    // 서버 사이드 렌더링 중이면 추적하지 않음
    if (typeof window === 'undefined') {
      if (this.DEBUG) {
        console.log('🚫 VisitorTracker: Skipping tracking (SSR)');
      }
      return false;
    }

    // 이미 추적된 방문자면 건너뛰기
    if (!this.isFirstVisit()) {
      if (this.DEBUG) {
        console.log('🚫 VisitorTracker: Skipping tracking (already tracked)');
      }
      return false;
    }

    // 이미 추적 중인 경우 기존 Promise 반환 (동시 실행 방지)
    if (this.trackingPromise) {
      if (this.DEBUG) {
        console.log('🔄 VisitorTracker: Tracking already in progress, returning existing promise');
      }
      return this.trackingPromise;
    }

    // 추적 Promise 생성 및 캐싱
    this.trackingPromise = (async () => {
      try {
        if (this.DEBUG) {
          console.log('🚀 VisitorTracker: Starting tracking for page:', landingPage);
        }

        // 추적 데이터 준비
        const trackData: TrackVisitorRequest = {
          landingPage,
          userAgent: navigator.userAgent, // 선택적 정보
        };

        // API 호출
        const response = await apiClient<TrackVisitorResponse>('analytics/track', {
          method: 'POST',
          body: JSON.stringify(trackData),
        });

        // 추적 성공 시 로컬스토리지에 기록
        if (response.success) {
          this.markAsTracked();

          if (this.DEBUG) {
            console.log('✅ VisitorTracker: Tracking successful');
          }

          return true;
        } else {
          console.warn('⚠️ VisitorTracker: API returned success=false');
          return false;
        }
      } catch (error) {
        // 네트워크 에러나 API 에러 시에도 사용자 경험에 영향 없도록
        console.error('❌ VisitorTracker: Tracking failed', error);

        // 개발환경, 프로덕션환경 모두 추적 완료로 표시하여 재시도 방지
        this.markAsTracked();

        if (this.DEBUG) {
          console.log('🔒 VisitorTracker: Marked as tracked to prevent retry');
          console.log('💡 VisitorTracker: To reset and retry, run: VisitorTracker.resetTracking()');
        }

        return false;
      } finally {
        // Promise 캐시 초기화
        this.trackingPromise = null;
      }
    })();

    return this.trackingPromise;
  }

  /**
   * 현재 페이지에서 추적 시도
   * 페이지 로드 후 자동으로 호출되는 편의 함수
   */
  static async trackCurrentPage(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const currentPath = window.location.pathname;
    return this.trackVisitor(currentPath);
  }
}

/**
 * 개발자 도구용 전역 함수 (개발 환경에서만)
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as { VisitorTracker: typeof VisitorTracker }).VisitorTracker = VisitorTracker;
  console.log('🛠️ VisitorTracker: Available globally for debugging');
}
