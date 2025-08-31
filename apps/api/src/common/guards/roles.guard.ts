import { UserRole } from '@kamf/interface/types/user.js';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // JWT 인증 가드를 통해 사용자 정보가 request에 설정되어야 함
    if (!user) {
      return false;
    }

    // 사용자의 역할 중 하나라도 요구되는 역할과 일치하면 허용
    return requiredRoles.some(role => user.roles?.map(r => r.name).includes(role));
  }
}
