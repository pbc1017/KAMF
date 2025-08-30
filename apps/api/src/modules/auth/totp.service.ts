import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';

import { AuthCode } from '../../entities/auth-code.entity.js';

@Injectable()
export class TotpService {
  constructor(
    @InjectRepository(AuthCode)
    private authCodeRepository: Repository<AuthCode>
  ) {}

  /**
   * 6자리 랜덤 코드 생성
   * @returns 100000~999999 범위의 6자리 문자열
   */
  generateCode(): string {
    const code = Math.floor(100000 + Math.random() * 900000);
    return code.toString();
  }

  /**
   * 생성된 코드를 데이터베이스에 저장
   * @param phoneNumber 전화번호
   * @param code 6자리 인증 코드
   * @returns Promise<void>
   */
  async saveCode(phoneNumber: string, code: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5분 후 만료

    await this.authCodeRepository.save({
      phoneNumber,
      code,
      expiresAt,
      isUsed: false,
    });
  }

  /**
   * 인증 코드 검증
   * @param phoneNumber 전화번호
   * @param code 입력받은 코드
   * @returns 검증 성공 여부
   */
  async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    const authCode = await this.authCodeRepository.findOne({
      where: {
        phoneNumber,
        code,
        isUsed: false,
      },
      order: { createdAt: 'DESC' }, // 최신 코드부터 확인
    });

    // 코드가 없거나 만료된 경우
    if (!authCode || new Date() > authCode.expiresAt) {
      return false;
    }

    // 코드 검증 성공 시 사용 처리
    authCode.isUsed = true;
    await this.authCodeRepository.save(authCode);

    return true;
  }

  /**
   * 만료된 인증 코드 정리 (Cron 작업용)
   * @returns 삭제된 코드 수
   */
  async cleanupExpiredCodes(): Promise<number> {
    const result = await this.authCodeRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    return result.affected || 0;
  }

  /**
   * 특정 전화번호의 미사용 코드 개수 확인 (스팸 방지용)
   * @param phoneNumber 전화번호
   * @returns 미사용 코드 개수
   */
  async getUnusedCodeCount(phoneNumber: string): Promise<number> {
    return await this.authCodeRepository.count({
      where: {
        phoneNumber,
        isUsed: false,
        expiresAt: LessThan(new Date()),
      },
    });
  }
}
