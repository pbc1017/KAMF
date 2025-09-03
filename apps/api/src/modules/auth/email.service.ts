import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Mailgun from 'mailgun-js';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private mailgunClient: Mailgun.Mailgun | null = null;
  private domain: string;
  private fromEmail: string;

  // 임시 인메모리 코드 저장소 (프로덕션에서는 Redis 사용 권장)
  private verificationCodes = new Map<string, { code: string; expiresAt: Date }>();

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('MAILGUN_API_KEY');
    this.domain = this.configService.get<string>('MAILGUN_DOMAIN') || 'sandbox-mailgun.domain';
    this.fromEmail =
      this.configService.get<string>('MAILGUN_FROM_EMAIL') || `noreply@${this.domain}`;

    if (apiKey && this.domain) {
      this.mailgunClient = Mailgun({ apiKey, domain: this.domain });
      this.logger.log('Mailgun service initialized successfully');
    } else {
      this.logger.warn('Mailgun credentials not found - Email will run in development mode');
    }
  }

  /**
   * 이메일 인증 코드 발송
   * @param email 수신자 이메일
   * @param code 6자리 인증 코드
   */
  async sendVerificationCode(email: string, code: string): Promise<void> {
    // 인증 코드를 메모리에 저장 (3분 후 만료)
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3분
    this.verificationCodes.set(email, { code, expiresAt });

    // 만료된 코드들 정리
    this.cleanupExpiredCodes();
    // 개발 모드: 콘솔 출력만
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(`[개발모드] 인증 코드 발송: ${email}`);
      this.logger.log(`💡 개발 모드에서는 인증 코드 "${code}"를 사용하세요`);
      return;
    }

    // 프로덕션: 실제 Mailgun API 호출
    if (!this.mailgunClient) {
      throw new Error('Mailgun 설정이 올바르지 않습니다');
    }

    try {
      const emailData: Mailgun.messages.SendData = {
        from: `KAMF 2025 <${this.fromEmail}>`,
        to: email,
        subject: 'KAMF 2025 이메일 인증 코드',
        html: this.generateVerificationEmailTemplate(code),
        text: this.generateVerificationEmailText(code),
      };

      const response = await this.mailgunClient.messages().send(emailData);
      this.logger.log(`인증 이메일 발송 성공: ${response.id}, To: ${email}`);
    } catch (error) {
      this.logger.error(`인증 이메일 발송 실패: ${email}`, error);
      throw new Error('인증 이메일 발송에 실패했습니다');
    }
  }

  /**
   * HTML 이메일 템플릿 생성 (웹앱 디자인 참고)
   */
  private generateVerificationEmailTemplate(code: string): string {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KAMF 2025 이메일 인증</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #374151;
      background: linear-gradient(135deg, #0f0f23 0%, #1e1b4b 100%);
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 50px 30px;
      text-align: center;
    }
    .content h2 {
      margin: 0 0 20px 0;
      font-size: 24px;
      color: #1f2937;
    }
    .content p {
      margin: 0 0 30px 0;
      font-size: 16px;
      color: #6b7280;
    }
    .code-container {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(236, 72, 153, 0.1) 100%);
      border: 2px solid rgba(168, 85, 247, 0.2);
      border-radius: 16px;
      padding: 30px;
      margin: 30px 0;
    }
    .verification-code {
      font-size: 36px;
      font-weight: 700;
      color: #6366f1;
      letter-spacing: 8px;
      margin: 0;
      text-align: center;
    }
    .code-label {
      font-size: 14px;
      color: #6b7280;
      margin: 10px 0 0 0;
      font-weight: 500;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 16px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);
      transition: all 0.3s ease;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
    }
    .warning {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 12px;
      padding: 20px;
      margin: 30px 0;
    }
    .warning p {
      margin: 0;
      font-size: 14px;
      color: #dc2626;
      font-weight: 500;
    }
    @media (max-width: 600px) {
      .container {
        margin: 20px;
        border-radius: 16px;
      }
      .header {
        padding: 30px 20px;
      }
      .header h1 {
        font-size: 28px;
      }
      .content {
        padding: 40px 20px;
      }
      .verification-code {
        font-size: 32px;
        letter-spacing: 6px;
      }
    }
  </style>
</head>
<body>
  <div style="padding: 40px 20px;">
    <div class="container">
      <div class="header">
        <h1>🎵 KAMF 2025</h1>
        <p>이메일 인증</p>
      </div>
      
      <div class="content">
        <h2>인증 코드가 도착했어요!</h2>
        <p>아래 인증 코드를 입력하여 로그인을 완료해주세요.</p>
        
        <div class="code-container">
          <p class="verification-code">${code}</p>
          <p class="code-label">6자리 인증 코드</p>
        </div>
        
        <div class="warning">
          <p>⚠️ 이 코드는 3분간 유효합니다. 다른 사람과 공유하지 마세요.</p>
        </div>
      </div>
      
      <div class="footer">
        <p>이 이메일은 KAMF 2025 로그인 요청에 의해 자동으로 발송되었습니다.</p>
        <p>본인이 요청하지 않았다면 이 메일을 무시해주세요.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * 텍스트 이메일 템플릿 생성 (HTML 지원하지 않는 클라이언트용)
   */
  private generateVerificationEmailText(code: string): string {
    return `
🎵 KAMF 2025 - 이메일 인증

안녕하세요!

KAMF 2025 로그인을 위한 인증 코드입니다.

인증 코드: ${code}

이 코드를 입력하여 로그인을 완료해주세요.

⚠️ 주의사항:
- 이 코드는 3분간 유효합니다
- 다른 사람과 공유하지 마세요
- 본인이 요청하지 않았다면 이 메일을 무시해주세요

KAMF 2025 팀 드림
`;
  }

  /**
   * 인증 코드 검증
   * @param email 이메일 주소
   * @param code 사용자 입력 코드
   * @returns 검증 성공 여부
   */
  async checkVerificationCode(email: string, code: string): Promise<boolean> {
    // 개발 모드: 특정 코드로 테스트
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(`[개발모드] 코드 검증: ${email} -> ${code}`);
      const isValid = code === '123456';
      this.logger.log(`검증 결과: ${isValid ? '✅ 성공' : '❌ 실패'} (개발용 코드: 123456)`);
      return isValid;
    }

    // 저장된 코드 확인
    const storedData = this.verificationCodes.get(email);
    if (!storedData) {
      this.logger.log(`코드 검증 실패: ${email} - 코드가 존재하지 않음`);
      return false;
    }

    // 만료 시간 확인
    if (new Date() > storedData.expiresAt) {
      this.verificationCodes.delete(email);
      this.logger.log(`코드 검증 실패: ${email} - 코드가 만료됨`);
      return false;
    }

    // 코드 비교
    const isValid = storedData.code === code;
    if (isValid) {
      // 검증 성공 시 코드 삭제
      this.verificationCodes.delete(email);
      this.logger.log(`코드 검증 성공: ${email}`);
    } else {
      this.logger.log(`코드 검증 실패: ${email} - 코드가 일치하지 않음`);
    }

    return isValid;
  }

  /**
   * 만료된 인증 코드들 정리
   */
  private cleanupExpiredCodes(): void {
    const now = new Date();
    for (const [email, data] of this.verificationCodes.entries()) {
      if (now > data.expiresAt) {
        this.verificationCodes.delete(email);
      }
    }
  }

  /**
   * 인증 코드 생성 (6자리 숫자)
   */
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 이메일 주소 유효성 검사
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Mailgun 서비스 사용 가능 여부 확인
   */
  isAvailable(): boolean {
    return !!this.mailgunClient;
  }

  /**
   * 현재 서비스 설정 정보 로깅 (디버깅용)
   */
  logServiceInfo(): void {
    this.logger.log(`Mailgun Service Status:`);
    this.logger.log(`- Client: ${this.mailgunClient ? '✅ 연결됨' : '❌ 없음'}`);
    this.logger.log(`- Domain: ${this.domain ? '✅ 설정됨' : '❌ 없음'}`);
    this.logger.log(`- From Email: ${this.fromEmail}`);
    this.logger.log(`- 환경: ${process.env.NODE_ENV || 'undefined'}`);
  }
}
