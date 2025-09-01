/**
 * User related DTOs (Data Transfer Objects)
 */

import { User } from '../types/user.type';

export interface GetUserResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export interface GetUsersResponse {
  success: boolean;
  data: {
    users: User[];
  };
}

export interface UpdateUserResponse {
  success: boolean;
  data: {
    user: User;
  };
}
