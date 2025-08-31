# GitHub Secrets 설정 가이드

## 🔧 서버 연결 정보

```bash
SERVER_HOST=210.117.237.104
SERVER_USERNAME=kamf
SERVER_PORT=12022  # SSH 포트 (22가 아님!)
SERVER_SSH_KEY=[앞서 생성한 개인키 전체 내용]
```

## 💾 데이터베이스 설정

```bash
# 데이터베이스 인증
DB_USERNAME=kamf_user
DB_PASSWORD=SecurePassword123!
MYSQL_ROOT_PASSWORD=RootPassword456!

# 환경별 DB_NAME은 자동 설정됨:
# - main 브랜치 배포 시: kamf_prod
# - dev 브랜치 배포 시: kamf_dev
```

## 🔐 JWT 및 보안

```bash
# 다음 명령어로 생성:
# JWT_SECRET=$(openssl rand -base64 64)
# REFRESH_TOKEN_SECRET=$(openssl rand -base64 32)
# NEXTAUTH_SECRET=$(openssl rand -base64 32)

JWT_SECRET=your_64_byte_random_string
REFRESH_TOKEN_SECRET=your_32_byte_random_string
NEXTAUTH_SECRET=your_32_byte_random_string
```

## 🐳 Docker Hub

```bash
DOCKERHUB_USERNAME=your_dockerhub_username
DOCKERHUB_TOKEN=your_access_token
```

## 📱 Twilio (선택사항)

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxx
```

## 🔔 Slack 알림 (선택사항)

```bash
# GitHub Variables에 설정:
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## 🌐 애플리케이션 URL

```bash
# 현재는 IP 사용, 나중에 도메인으로 변경
CORS_ORIGIN=http://210.117.237.104
NEXT_PUBLIC_API_URL=http://210.117.237.104
NEXT_PUBLIC_APP_URL=http://210.117.237.104
```

## 🗄️ 개발 시 프로덕션 DB 접근 방법

### 방법 1: 직접 연결

```bash
mysql -h 210.117.237.104 -P 3306 -u kamf_user -p kamf_prod
```

### 방법 2: SSH 터널 (권장)

```bash
# 터널 생성
ssh -L 3307:localhost:3306 -p 12022 kamf@210.117.237.104

# 로컬 접속
mysql -h 127.0.0.1 -P 3307 -u kamf_user -p kamf_prod
```

### 방법 3: 로컬 환경변수 설정

```bash
# .env.local 파일에 추가
DB_HOST=210.117.237.104
DB_NAME=kamf_prod  # 프로덕션 DB 접근
```
