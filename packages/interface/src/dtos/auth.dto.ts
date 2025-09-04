/**
 * Authentication related DTOs (Data Transfer Objects)
 */

import { AuthTokens } from '../types/auth.type.js';

export interface AuthRequest {
  phoneNumber: string;
}

export interface VerifyCodeRequest {
  phoneNumber: string;
  code: string;
}

export interface AuthResponse {
  user: {
    id: string;
    phoneNumber: string;
    displayName: string;
    roles: string[];
  };
  tokens: AuthTokens;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RequestCodeResponse {
  message: string;
}

// Legacy types (keeping for compatibility)
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
  tokens: AuthTokens;
}
