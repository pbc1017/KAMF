import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: Twilio;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (accountSid && authToken) {
      this.twilioClient = new Twilio(accountSid, authToken);
      this.logger.log('Twilio client initialized');
    } else {
      this.logger.warn('Twilio credentials not found, SMS will be logged to console');
    }
  }

  /**
   * 인증 코드 SMS 발송
   * @param phoneNumber 수신자 전화번호 (국제 형식: +821012345678)
   * @param code 6자리 인증 코드
   */
  async sendAuthCode(phoneNumber: string, code: string): Promise<void> {
    const message = `[KAMF] 인증코드: ${code}`;

    // 개발 환경에서는 콘솔에 출력
    if (this.configService.get('NODE_ENV') === 'development' || !this.twilioClient) {
      this.logger.log(`[SMS 발송] ${phoneNumber} -> 인증코드: ${code}`);
      return;
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.configService.get<string>('TWILIO_PHONE_NUMBER'),
        to: this.formatPhoneNumber(phoneNumber),
      });

      this.logger.log(`SMS sent successfully to ${phoneNumber}, SID: ${result.sid}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phoneNumber}:`, error);
      throw new Error('SMS 발송에 실패했습니다');
    }
  }

  /**
   * 전화번호를 국제 형식으로 변환
   * @param phoneNumber 입력받은 전화번호
   * @returns 국제 형식 전화번호
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // 이미 +로 시작하는 경우 그대로 반환
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }

    // 한국 번호 형식 변환
    if (phoneNumber.startsWith('010') || phoneNumber.startsWith('011')) {
      return `+82${phoneNumber.substring(1)}`;
    }

    // 0으로 시작하는 경우 +82로 변환
    if (phoneNumber.startsWith('0')) {
      return `+82${phoneNumber.substring(1)}`;
    }

    // 기타 경우 그대로 반환 (에러 처리는 Twilio에서)
    return phoneNumber;
  }

  /**
   * SMS 발송 가능 여부 확인
   * @returns Twilio 클라이언트 연결 상태
   */
  isAvailable(): boolean {
    return !!this.twilioClient;
  }
}
