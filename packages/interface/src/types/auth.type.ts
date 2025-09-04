/**
 * Authentication related types
 */

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
  // refreshToken은 HTTP-only 쿠키로 처리되므로 제거
}

export interface AuthUser {
  id: string;
  phoneNumber: string;
  displayName: string;
  roles: string[];
}

export interface LoginStep {
  step: 'phone' | 'code';
  phoneNumber: string;
  isLoading: boolean;
}
