import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new BadRequestException('User not found in request');
    }

    // 특정 속성을 요청한 경우
    if (data) {
      const value = user[data];
      if (value === undefined || value === null) {
        throw new BadRequestException(`User property '${data}' not found`);
      }
      return String(value); // 문자열로 변환하여 반환
    }

    // 전체 user 객체 반환
    return user;
  }
);
