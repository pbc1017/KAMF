/**
 * User related DTOs (Data Transfer Objects)
 */

import { User } from '../types/user.type';

export interface GetUserResponse {
  user: User;
}

export interface GetUsersResponse {
  users: User[];
}

export interface UpdateUserResponse {
  user: User;
}
