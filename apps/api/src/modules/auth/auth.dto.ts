import { AuthRequest, VerifyCodeRequest } from '@kamf/interface/dtos/auth.dto.js';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, Matches, IsEmail } from 'class-validator';

export class AuthRequestDto implements AuthRequest {
  @ApiProperty({
    description: '이메일 주소',
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty({ message: '이메일을 입력해주세요' })
  @IsEmail({}, { message: '올바른 이메일 주소를 입력해주세요' })
  email: string;
}

export class VerifyCodeRequestDto implements VerifyCodeRequest {
  @ApiProperty({
    description: '이메일 주소',
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty({ message: '이메일을 입력해주세요' })
  @IsEmail({}, { message: '올바른 이메일 주소를 입력해주세요' })
  email: string;

  @ApiProperty({
    description: '6자리 인증 코드',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: '인증 코드를 입력해주세요' })
  @Length(6, 6, { message: '인증 코드는 6자리여야 합니다' })
  @Matches(/^\d{6}$/, { message: '인증 코드는 6자리 숫자여야 합니다' })
  code: string;
}

// RefreshTokenRequestDto 제거됨 - HTTP-only 쿠키로 처리
