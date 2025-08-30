const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}/${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`;

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
    throw error;
  }
}
