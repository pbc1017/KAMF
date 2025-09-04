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
import { JwtAuthService } from './jwt.service.js';
import { SmsService } from './sms.service.js';

@ApiTags('인증 (Authentication)')
@Controller('auth')
export class AuthController {
  constructor(
    private smsService: SmsService,
    private jwtService: JwtAuthService,
    private userService: UserService
  ) {}

  /**
   * 인증 코드 요청 API
   * POST /api/auth/request-code
   */
  @ApiOperation({
    summary: '인증 코드 요청',
    description: '휴대폰 번호로 SMS 인증 코드를 요청합니다.',
  })
  @ApiBody({ type: AuthRequestDto })
  @ApiOkResponse({
    description: '인증 코드 발송 성공',
    type: MessageResponseDto,
  })
  @Post('request-code')
  async requestCode(@Body() body: AuthRequest): Promise<ApiResponse<RequestCodeResponse>> {
    try {
      // 전화번호 형식 기본 검증
      if (!body.phoneNumber || typeof body.phoneNumber !== 'string') {
        throw new BadRequestException('유효한 전화번호를 입력해주세요');
      }

      // 전화번호 정규화 (공백, 하이픈 제거)
      const normalizedPhoneNumber = body.phoneNumber.replace(/[\s-]/g, '');

      // Twilio Verify API로 인증 시작
      await this.smsService.startVerification(normalizedPhoneNumber);

      return {
        success: true,
        data: {
          message:
            process.env.NODE_ENV === 'development'
              ? '개발 모드: 인증 코드 "123456"을 사용하세요'
              : '인증 코드가 발송되었습니다',
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
    description: 'SMS로 받은 인증 코드를 검증하여 로그인을 진행합니다.',
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
      if (!body.phoneNumber || !body.code) {
        throw new BadRequestException('전화번호와 인증 코드를 모두 입력해주세요');
      }

      if (body.code.length !== 6 || !/^\d{6}$/.test(body.code)) {
        throw new BadRequestException('인증 코드는 6자리 숫자여야 합니다');
      }

      // 전화번호 정규화
      const normalizedPhoneNumber = body.phoneNumber.replace(/[\s-]/g, '');

      // Twilio Verify API로 코드 검증
      const isValidCode = await this.smsService.checkVerification(normalizedPhoneNumber, body.code);

      if (!isValidCode) {
        throw new UnauthorizedException('유효하지 않은 인증 코드입니다');
      }

      // 사용자 조회 또는 생성
      let user = await this.userService.findByPhoneNumber(normalizedPhoneNumber);

      if (!user) {
        // 신규 사용자 생성 (기본 USER 역할)
        user = await this.userService.createUser({
          phoneNumber: normalizedPhoneNumber,
          roles: [UserRole.USER],
        });
        console.log(`신규 사용자 생성: ${user.id}, 전화번호: ${normalizedPhoneNumber}`);
      } else {
        console.log(`기존 사용자 로그인: ${user.id}, 전화번호: ${normalizedPhoneNumber}`);
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
            phoneNumber: user.phoneNumber,
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
            phoneNumber: user.phoneNumber,
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
