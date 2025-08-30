import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class AuthRequestDto {
  @ApiProperty({
    description: '전화번호 (010-1234-5678 또는 01012345678 형식)',
    example: '010-1234-5678',
  })
  @IsString()
  @IsNotEmpty({ message: '전화번호를 입력해주세요' })
  phoneNumber: string;
}

export class VerifyCodeRequestDto {
  @ApiProperty({
    description: '전화번호 (010-1234-5678 또는 01012345678 형식)',
    example: '010-1234-5678',
  })
  @IsString()
  @IsNotEmpty({ message: '전화번호를 입력해주세요' })
  phoneNumber: string;

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

export class RefreshTokenRequestDto {
  @ApiProperty({
    description: 'Refresh Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh Token이 필요합니다' })
  refreshToken: string;
}
