import { UserRole, UpdateUserRequest } from '@kamf/interface/types/user.type.js';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsEnum, Length } from 'class-validator';

export class UpdateDisplayNameDto implements Pick<UpdateUserRequest, 'displayName'> {
  @ApiProperty({
    description: '사용자 표시 이름 (1-50자)',
    example: '김축제',
  })
  @IsString()
  @IsNotEmpty({ message: '유효한 이름을 입력해주세요' })
  @Length(1, 50, { message: '이름은 1-50자 사이여야 합니다' })
  displayName: string;
}

export class UpdateUserRolesDto implements Pick<UpdateUserRequest, 'roles'> {
  @ApiProperty({
    description: '사용자 역할 목록',
    enum: UserRole,
    isArray: true,
    example: [UserRole.USER, UserRole.BOOTH],
  })
  @IsArray()
  @IsNotEmpty({ message: '최소 하나의 역할을 지정해야 합니다' })
  @IsEnum(UserRole, { each: true, message: '유효하지 않은 역할입니다' })
  roles: UserRole[];
}
