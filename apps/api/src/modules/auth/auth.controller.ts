import type {
  AuthResponse,
  RequestCodeResponse,
  AuthRequest,
  VerifyCodeRequest,
  RefreshTokenRequest,
} from '@kamf/interface/dtos/auth.dto.js';
import { ApiResponse } from '@kamf/interface/types/common.type.js';
import { UserRole } from '@kamf/interface/types/user.type.js';
import { Controller, Post, Body, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBody } from '@nestjs/swagger';

import { MessageResponseDto, AuthResponseDto } from '../../common/dto/common.dto.js';
import { NicknameGenerator } from '../../common/utils/nickname-generator.js';
import { UserService } from '../users/users.service.js';

import { AuthRequestDto, VerifyCodeRequestDto, RefreshTokenRequestDto } from './auth.dto.js';
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
              ? `개발 모드: 인증 코드 "${code}"를 사용하세요`
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
  @ApiOperation({
    summary: '인증 코드 검증 및 로그인',
    description: '이메일로 받은 인증 코드를 검증하여 로그인을 진행합니다.',
  })
  @ApiBody({ type: VerifyCodeRequestDto })
  @ApiOkResponse({
    description: '인증 성공 및 토큰 발급',
    type: AuthResponseDto,
  })
  @Post('verify')
  async verifyCode(@Body() body: VerifyCodeRequest): Promise<ApiResponse<AuthResponse>> {
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

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            roles: user.roles.map(role => role.name),
          },
          tokens,
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
    description: 'Refresh Token을 사용하여 새로운 Access Token을 발급받습니다.',
  })
  @ApiBody({ type: RefreshTokenRequestDto })
  @ApiOkResponse({
    description: '토큰 갱신 성공',
    type: AuthResponseDto,
  })
  @Post('refresh')
  async refreshToken(@Body() body: RefreshTokenRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      // Refresh Token 검증
      if (!body.refreshToken) {
        throw new BadRequestException('Refresh Token이 필요합니다');
      }

      // 토큰 검증 및 페이로드 추출
      const payload = this.jwtService.verifyRefreshToken(body.refreshToken);

      // 사용자 정보 조회 (최신 정보 반영)
      const user = await this.userService.findById(payload.userId);
      if (!user) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다');
      }

      // 새로운 토큰 쌍 생성
      const tokens = this.jwtService.refreshTokens(user);

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            roles: user.roles.map(role => role.name),
          },
          tokens,
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
}
