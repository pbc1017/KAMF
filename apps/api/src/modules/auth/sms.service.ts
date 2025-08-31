import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: twilio.Twilio;
  private serviceSid: string;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.serviceSid = this.configService.get<string>('TWILIO_SERVICE_SID');

    if (accountSid && authToken && this.serviceSid) {
      this.twilioClient = twilio(accountSid, authToken);
      this.logger.log('Twilio Verify service initialized successfully');
    } else {
      this.logger.warn(
        'Twilio credentials or service SID not found - SMS will run in development mode'
      );
    }
  }

  /**
   * 인증 시작 - Twilio Verify API 호출
   * @param phoneNumber 전화번호 (국제 형식 권장)
   */
  async startVerification(phoneNumber: string): Promise<void> {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);

    // 개발 모드: 콘솔 출력만
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(`[개발모드] 인증 코드 발송 시작: ${formattedNumber}`);
      this.logger.log(`💡 개발 모드에서는 인증 코드 "123456"을 사용하세요`);
      return;
    }

    // 프로덕션: 실제 Twilio Verify API 호출
    if (!this.twilioClient || !this.serviceSid) {
      throw new Error('Twilio 설정이 올바르지 않습니다');
    }

    try {
      const verification = await this.twilioClient.verify.v2
        .services(this.serviceSid)
        .verifications.create({
          to: formattedNumber,
          channel: 'sms',
        });

      this.logger.log(
        `인증 시작 성공: SID=${verification.sid}, Status=${verification.status}, To=${formattedNumber}`
      );
    } catch (error) {
      this.logger.error(`인증 시작 실패: ${formattedNumber}`, error);
      throw new Error('인증 코드 발송에 실패했습니다');
    }
  }

  /**
   * 인증 확인 - Twilio Verify API로 코드 검증
   * @param phoneNumber 전화번호
   * @param code 사용자 입력 코드
   * @returns 검증 성공 여부
   */
  async checkVerification(phoneNumber: string, code: string): Promise<boolean> {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);

    // 개발 모드: 특정 코드로 테스트
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(`[개발모드] 코드 검증: ${formattedNumber} -> ${code}`);
      const isValid = code === '123456';
      this.logger.log(`검증 결과: ${isValid ? '✅ 성공' : '❌ 실패'} (개발용 코드: 123456)`);
      return isValid;
    }

    // 프로덕션: 실제 Twilio Verify API 검증
    if (!this.twilioClient || !this.serviceSid) {
      this.logger.error('Twilio 클라이언트가 초기화되지 않았습니다');
      return false;
    }

    try {
      const verificationCheck = await this.twilioClient.verify.v2
        .services(this.serviceSid)
        .verificationChecks.create({
          to: formattedNumber,
          code: code,
        });

      const isApproved = verificationCheck.status === 'approved';
      this.logger.log(
        `인증 확인 완료: SID=${verificationCheck.sid}, Status=${verificationCheck.status}, Result=${isApproved ? '✅ 성공' : '❌ 실패'}`
      );

      return isApproved;
    } catch (error) {
      this.logger.error(`인증 확인 실패: ${formattedNumber}, Code=${code}`, error);
      return false;
    }
  }

  /**
   * 전화번호를 국제 형식으로 변환
   * @param phoneNumber 입력받은 전화번호
   * @returns 국제 형식 전화번호
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // 이미 국제 형식인 경우
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }

    // 한국 번호 처리 (010, 011 등)
    if (
      phoneNumber.startsWith('010') ||
      phoneNumber.startsWith('011') ||
      phoneNumber.startsWith('016') ||
      phoneNumber.startsWith('017') ||
      phoneNumber.startsWith('018') ||
      phoneNumber.startsWith('019')
    ) {
      return `+82${phoneNumber.substring(1)}`;
    }

    // 0으로 시작하는 일반적인 형태
    if (phoneNumber.startsWith('0')) {
      return `+82${phoneNumber.substring(1)}`;
    }

    // 기타 경우는 그대로 반환 (에러 처리는 Twilio에서)
    return phoneNumber;
  }

  /**
   * Twilio Verify 서비스 사용 가능 여부 확인
   * @returns 서비스 사용 가능 여부
   */
  isAvailable(): boolean {
    return !!(this.twilioClient && this.serviceSid);
  }

  /**
   * 현재 서비스 설정 정보 로깅 (디버깅용)
   */
  logServiceInfo(): void {
    this.logger.log(`Twilio Service Status:`);
    this.logger.log(`- Client: ${this.twilioClient ? '✅ 연결됨' : '❌ 없음'}`);
    this.logger.log(`- Service SID: ${this.serviceSid ? '✅ 설정됨' : '❌ 없음'}`);
    this.logger.log(`- 환경: ${process.env.NODE_ENV || 'undefined'}`);
  }
}
