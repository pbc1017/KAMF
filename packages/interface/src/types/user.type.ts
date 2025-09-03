import { BaseEntity } from './common.type';

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
  email: string;
  displayName: string | null;
  roles: UserRole[];
}

export interface CreateUserRequest {
  email: string;
  displayName?: string | null;
  roles?: UserRole[];
}

export interface UpdateUserRequest {
  displayName?: string | null;
  roles?: UserRole[];
}

export interface UserSession {
  userId: string;
  email: string;
  roles: UserRole[];
  expiresAt: Date;
}
