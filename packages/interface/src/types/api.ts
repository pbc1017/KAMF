/**
 * API related types and interfaces
 */

import { Booth, Stage, Zone } from './festival';
import { User } from './user';

// Festival API types
export interface GetBoothsResponse {
  data: Booth[];
}

export interface GetBoothsByZoneRequest {
  zone: Zone;
}

export interface GetBoothsByZoneResponse {
  data: Booth[];
}

export interface GetStagesResponse {
  data: {
    sat: Stage[];
    sun: Stage[];
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Auth related types
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

export interface RefreshTokenRequest {
  refreshToken: string;
}

// User related API responses
export interface GetUserResponse {
  user: User;
}

export interface GetUsersResponse {
  users: User[];
}

export interface UpdateUserResponse {
  user: User;
}

export interface RequestCodeResponse {
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}
