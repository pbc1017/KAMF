import { isValidAuthResponse, AuthError } from '@kamf/interface/dtos/auth.dto.js';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 빌드 환경 감지
const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV === 'production';

// ApiError 클래스는 @kamf/interface에서 AuthError로 대체됨

// 빌드 타임용 mock 데이터 생성
function getMockResponse(endpoint: string) {
  if (endpoint.includes('booths')) {
    return {
      data: [],
    };
  }

  if (endpoint.includes('stages')) {
    return {
      data: {
        fri: [],
        sat: [],
      },
    };
  }

  return {};
}

// 토큰 관리 함수들
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

// getRefreshToken 제거 - 더 이상 필요 없음 (쿠키로 처리)
// function getRefreshToken(): string | null {
//   if (typeof window === 'undefined') return null;
//   return localStorage.getItem('refreshToken');
// }

function setTokens(accessToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', accessToken);
  // refreshToken localStorage 저장 제거 - 쿠키로 처리
}

function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  // refreshToken localStorage 제거 로직 삭제 - 쿠키는 서버에서 관리
}

// 토큰 관리 함수들을 외부에서 사용할 수 있도록 export
export { getAuthToken, setTokens, clearTokens };

// 토큰 갱신을 위한 Promise 캐싱 (동시 요청 시 중복 방지)
let refreshTokenPromise: Promise<{ accessToken: string } | null> | null = null;

// 토큰 갱신 함수
async function refreshAccessToken(): Promise<{ accessToken: string } | null> {
  // 이미 갱신 중인 경우 기존 Promise 반환 (중복 방지)
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  refreshTokenPromise = (async () => {
    try {
      console.log('🔄 Attempting to refresh access token using HTTP-only cookie...');

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // HTTP-only 쿠키 자동 전송
      });

      if (!response.ok) {
        throw new AuthError(`Token refresh failed: ${response.statusText}`, 'NETWORK_ERROR');
      }

      const data = await response.json();

      // 타입 가드를 사용한 응답 검증
      if (isValidAuthResponse(data)) {
        const { accessToken } = data.data!.tokens;
        setTokens(accessToken); // localStorage에는 access token만 저장
        console.log('✅ Token refresh successful');
        return { accessToken };
      } else {
        throw new AuthError('Invalid refresh response format', 'PARSE_ERROR');
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);

      // 토큰 갱신 실패 시 localStorage의 access token 삭제
      clearTokens();

      // 로그아웃 이벤트 발생 (AuthProvider에서 처리하도록)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }

      return null;
    } finally {
      // Promise 캐시 초기화
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  return apiClientInternal<T>(endpoint, options, false);
}

// 내부 apiClient 함수 (재시도 플래그 포함)
async function apiClientInternal<T>(
  endpoint: string,
  options?: RequestInit,
  isRetry: boolean = false
): Promise<T> {
  const url = `${API_BASE_URL}/${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`;

  // 빌드 시에는 API 호출을 건너뛰고 적절한 mock 응답 반환
  if (isBuildTime) {
    console.log('Skipping API call during build time:', url);
    return getMockResponse(endpoint) as T;
  }

  // Authorization 헤더 준비
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options?.headers as Record<string, string>) || {}),
  };

  try {
    const response = await fetch(url, {
      headers,
      credentials: 'include', // HTTP-only 쿠키 자동 전송
      ...options,
    });

    // 401 Unauthorized 처리
    if (response.status === 401 && !isRetry) {
      console.log('401 Unauthorized detected, attempting token refresh...');

      // 토큰 갱신 시도
      const refreshResult = await refreshAccessToken();

      if (refreshResult) {
        // 토큰 갱신 성공 - 원래 요청을 새 토큰으로 재시도
        return apiClientInternal<T>(endpoint, options, true);
      } else {
        // 토큰 갱신 실패 - 에러 던지기
        throw new AuthError('Authentication failed - please login again', 'EXPIRED_TOKEN');
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new AuthError(
        `API request failed: ${response.statusText} - ${errorText}`,
        'NETWORK_ERROR'
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // AuthError는 그대로 재던지기
    if (error instanceof AuthError) {
      throw error;
    }

    // 네트워크 오류 시 개발환경에서는 적절한 mock 응답 반환
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
      console.warn('Network error detected, returning mock response for development');
      return getMockResponse(endpoint) as T;
    }

    throw error;
  }
}
