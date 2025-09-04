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
  phoneNumber: string;
  displayName: string | null;
  roles: UserRole[];
}

export interface CreateUserRequest {
  phoneNumber: string;
  displayName?: string | null;
  roles?: UserRole[];
}

export interface UpdateUserRequest {
  displayName?: string | null;
  roles?: UserRole[];
}

export interface UserSession {
  userId: string;
  phoneNumber: string;
  roles: UserRole[];
  expiresAt: Date;
}
