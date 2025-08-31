const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 빌드 환경 감지
const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV === 'production';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

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

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}/${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`;

  // 빌드 시에는 API 호출을 건너뛰고 적절한 mock 응답 반환
  if (isBuildTime) {
    console.log('Skipping API call during build time:', url);
    return getMockResponse(endpoint) as T;
  }

  console.log('API Request:', url); // 디버깅용

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    console.log('API Response:', response.status, response.statusText); // 디버깅용

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText); // 디버깅용
      throw new ApiError(
        `API request failed: ${response.statusText} - ${errorText}`,
        response.status,
        response.statusText
      );
    }

    const data = await response.json();
    console.log('API Response Data:', data); // 디버깅용
    return data;
  } catch (error) {
    console.error('API Client Error:', error); // 디버깅용

    // 네트워크 오류 시 개발환경에서는 적절한 mock 응답 반환
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
      console.warn('Network error detected, returning mock response for development');
      return getMockResponse(endpoint) as T;
    }

    throw error;
  }
}
