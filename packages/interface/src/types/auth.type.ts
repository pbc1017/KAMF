/**
 * Authentication related types
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
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
