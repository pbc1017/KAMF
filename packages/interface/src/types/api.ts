/**
 * API related types and interfaces
 */

import { Booth, Stage, Zone } from './festival';

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
