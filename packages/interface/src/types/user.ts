import { BaseEntity } from './common';

/**
 * User related types and interfaces
 */

export enum UserRole {
  USER = 'user',
  BOOTH = 'booth',
  SAFETY = 'safety',
  ADMIN = 'admin',
}

export interface User extends BaseEntity {
  phoneNumber: string;
  displayName: string;
  roles: UserRole[];
}

export interface CreateUserRequest {
  phoneNumber: string;
  displayName?: string;
  roles?: UserRole[];
}

export interface UpdateUserRequest {
  displayName?: string;
  roles?: UserRole[];
}

export interface UserSession {
  userId: string;
  phoneNumber: string;
  roles: UserRole[];
  expiresAt: Date;
}
