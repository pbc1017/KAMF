import type {
  AuthResponse,
  RequestCodeResponse,
  AuthRequest,
  VerifyCodeRequest,
} from '@kamf/interface/dtos/auth.dto.js';
import { ApiResponse } from '@kamf/interface/types/common.type.js';
import { UserRole } from '@kamf/interface/types/user.type.js';
import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  BadRequestException,
  Res,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { MessageResponseDto, AuthResponseDto } from '../../common/dto/common.dto.js';
import { NicknameGenerator } from '../../common/utils/nickname-generator.js';
import { UserService } from '../users/users.service.js';

import { AuthRequestDto } from './auth.dto.js';
import { EmailService } from './email.service.js';
import { JwtAuthService } from './jwt.service.js';

@ApiTags('인증 (Authentication)')
@Controller('auth')
export class AuthController {
  constructor(
    private emailService: EmailService,
    private jwtService: JwtAuthService,
    private userService: UserService
  ) {}

  /**
   * HTTP-only 쿠키 설정을 위한 헬퍼 메서드
   */
  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    const isProduction = process.env.NODE_ENV === 'production';

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // production에서만 HTTPS 필수
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
      path: '/',
      // 개발환경에서는 localhost 전체에서 쿠키 공유, 프로덕션에서는 도메인 미지정
      ...(isProduction ? {} : { domain: 'localhost' }),
    };

    res.cookie('refreshToken', refreshToken, cookieOptions);
  }

  /**
   * 인증 코드 요청 API
   * POST /api/auth/request-code
   */
  @ApiOperation({
    summary: '인증 코드 요청',
    description: '이메일 주소로 인증 코드를 요청합니다.',
  })
  @ApiBody({ type: AuthRequestDto })
  @ApiOkResponse({
    description: '인증 코드 발송 성공',
    type: MessageResponseDto,
  })
  @Post('request-code')
  async requestCode(@Body() body: AuthRequest): Promise<ApiResponse<RequestCodeResponse>> {
    try {
      // 이메일 형식 기본 검증
      if (!body.email || typeof body.email !== 'string') {
        throw new BadRequestException('유효한 이메일 주소를 입력해주세요');
      }

      // 이메일 유효성 검증
      if (!this.emailService.isValidEmail(body.email)) {
        throw new BadRequestException('올바른 이메일 주소를 입력해주세요');
      }

      // 인증 코드 생성
      const code = this.emailService.generateVerificationCode();

      // 이메일로 인증 코드 발송
      await this.emailService.sendVerificationCode(body.email, code);

      return {
        success: true,
        data: {
          message:
            process.env.NODE_ENV === 'development'
              ? `개발 모드: 인증 코드 123456을 사용하세요`
              : '인증 코드가 이메일로 발송되었습니다',
        },
      };
    } catch (error) {
      console.error('인증 코드 요청 실패:', error);
      throw new BadRequestException('인증 코드 발송에 실패했습니다');
    }
  }

  /**
   * 인증 코드 검증 및 로그인 API
   * POST /api/auth/verify
   */
  @Post('verify')
  async verifyCode(
    @Body() body: VerifyCodeRequest,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse<AuthResponse>> {
    try {
      // 입력값 기본 검증
      if (!body.email || !body.code) {
        throw new BadRequestException('이메일과 인증 코드를 모두 입력해주세요');
      }

      if (body.code.length !== 6 || !/^\d{6}$/.test(body.code)) {
        throw new BadRequestException('인증 코드는 6자리 숫자여야 합니다');
      }

      // 이메일 유효성 검증
      if (!this.emailService.isValidEmail(body.email)) {
        throw new BadRequestException('올바른 이메일 주소를 입력해주세요');
      }

      // 이메일 인증 코드 검증
      const isValidCode = await this.emailService.checkVerificationCode(body.email, body.code);

      if (!isValidCode) {
        throw new UnauthorizedException('유효하지 않은 인증 코드입니다');
      }

      // 사용자 조회 또는 생성
      let user = await this.userService.findByEmail(body.email);

      if (!user) {
        // 신규 사용자 생성 (기본 USER 역할)
        user = await this.userService.createUser({
          email: body.email,
          roles: [UserRole.USER],
        });
        console.log(`신규 사용자 생성: ${user.id}, 이메일: ${body.email}`);
      } else {
        console.log(`기존 사용자 로그인: ${user.id}, 이메일: ${body.email}`);
      }

      // displayName이 null인 경우 자동 생성
      if (!user.displayName) {
        try {
          const generatedName = NicknameGenerator.generate();
          user = await this.userService.updateUser(user.id, { displayName: generatedName });
          console.log(`자동 닉네임 생성: ${user.id}, 닉네임: ${generatedName}`);
        } catch (error) {
          console.error('닉네임 자동 생성 실패:', error);
          // 닉네임 생성에 실패해도 로그인은 계속 진행
        }
      }

      // roles가 없거나 비어있는 경우 기본 USER 역할 부여
      if (!user.roles || user.roles.length === 0) {
        try {
          user = await this.userService.updateUserRoles(user.id, [UserRole.USER]);
          console.log(`기본 역할 부여: ${user.id}, 역할: USER`);
        } catch (error) {
          console.error('기본 역할 부여 실패:', error);
          // 역할 부여에 실패해도 로그인은 계속 진행
        }
      }

      // JWT 토큰 생성
      const tokens = this.jwtService.generateTokens(user);

      // HTTP-only 쿠키로 refresh token 설정
      this.setRefreshTokenCookie(res, tokens.refreshToken);

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            roles: user.roles.map(role => role.name),
          },
          tokens: {
            accessToken: tokens.accessToken,
            expiresIn: tokens.expiresIn,
            // refreshToken 제거 - 쿠키로 처리
          },
        },
      };
    } catch (error) {
      console.error('인증 코드 검증 실패:', error);

      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('인증 처리 중 오류가 발생했습니다');
    }
  }

  /**
   * 토큰 갱신 API
   * POST /api/auth/refresh
   */
  @ApiOperation({
    summary: '토큰 갱신',
    description: 'HTTP-only 쿠키의 Refresh Token을 사용하여 새로운 Access Token을 발급받습니다.',
  })
  @ApiOkResponse({
    description: '토큰 갱신 성공',
    type: AuthResponseDto,
  })
  @Post('refresh')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<
    ApiResponse<
      Omit<AuthResponse, 'tokens'> & { tokens: { accessToken: string; expiresIn: number } }
    >
  > {
    try {
      // HTTP-only 쿠키에서 Refresh Token 추출
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        console.error('❌ No refresh token found in cookies');
        console.error('🔍 Available cookie keys:', Object.keys(req.cookies || {}));
        throw new BadRequestException('Refresh Token이 필요합니다');
      }

      // 토큰 검증 및 페이로드 추출
      const payload = this.jwtService.verifyRefreshToken(refreshToken);

      // 사용자 정보 조회 (최신 정보 반영)
      const user = await this.userService.findById(payload.userId);
      if (!user) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다');
      }

      // 새로운 토큰 쌍 생성
      const tokens = this.jwtService.refreshTokens(user);

      // 새로운 Refresh Token을 HTTP-only 쿠키로 설정
      this.setRefreshTokenCookie(res, tokens.refreshToken);

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            roles: user.roles.map(role => role.name),
          },
          tokens: {
            accessToken: tokens.accessToken,
            expiresIn: tokens.expiresIn,
          },
        },
      };
    } catch (error) {
      console.error('토큰 갱신 실패:', error);

      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }

      throw new UnauthorizedException('토큰 갱신에 실패했습니다');
    }
  }

  /**
   * 로그아웃 API
   * POST /api/auth/logout
   */
  @ApiOperation({
    summary: '로그아웃',
    description: 'HTTP-only 쿠키의 Refresh Token을 제거합니다.',
  })
  @ApiOkResponse({
    description: '로그아웃 성공',
    type: MessageResponseDto,
  })
  @Post('logout')
  async logout(
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      // Refresh Token 쿠키 제거
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      return {
        success: true,
        data: {
          message: '성공적으로 로그아웃되었습니다',
        },
      };
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw new BadRequestException('로그아웃 처리 중 오류가 발생했습니다');
    }
  }
}
