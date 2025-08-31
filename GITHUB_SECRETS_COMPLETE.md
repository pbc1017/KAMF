# 🔐 GitHub Secrets 완전 설정 가이드

## 📍 서버 연결 정보

| Secret Name       | Value               | 비고                        |
| ----------------- | ------------------- | --------------------------- |
| `SERVER_HOST`     | `210.117.237.104`   | 서버 IP                     |
| `SERVER_USERNAME` | `kamf`              | SSH 사용자명                |
| `SERVER_PORT`     | `12022`             | SSH 포트 (22가 아님!)       |
| `SERVER_SSH_KEY`  | `[SSH 개인키 전체]` | -----BEGIN부터 -----END까지 |

## 💾 데이터베이스 설정

| Secret Name           | Value                | 비고                 |
| --------------------- | -------------------- | -------------------- |
| `DB_USERNAME`         | `kamf_user`          | MySQL 사용자명       |
| `DB_PASSWORD`         | `[사용자 설정 필요]` | 강력한 비밀번호 설정 |
| `MYSQL_ROOT_PASSWORD` | `[사용자 설정 필요]` | MySQL root 비밀번호  |

> **참고**: DB_NAME은 브랜치별로 자동 설정됩니다
>
> - `main` 브랜치 → `kamf_prod`
> - `dev` 브랜치 → `kamf_dev`

## 🔐 JWT 및 보안 토큰

| Secret Name            | Value                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `JWT_SECRET`           | `enWjiOspGj/tUIQ/injzb4jNZHVzYv9dPCHwPMmgobdi+aa3ZG0G+2MpYvtiQ4L/rENTwZ+ymc+3aEUrkumwcA==` |
| `REFRESH_TOKEN_SECRET` | `g7IrRABM1TJ37jydntOa1dOWUYvTE/VVcx7LCY2+S/4=`                                             |
| `NEXTAUTH_SECRET`      | `jWYmgg+GWnS08kA05kRZjukHgzpE/plB6cK7XIUIUZY=`                                             |

## 🐳 Docker Hub 연동

| Secret Name          | Value                | 비고                    |
| -------------------- | -------------------- | ----------------------- |
| `DOCKERHUB_USERNAME` | `[사용자 설정 필요]` | Docker Hub 사용자명     |
| `DOCKERHUB_TOKEN`    | `[사용자 설정 필요]` | Docker Hub Access Token |

## 📱 Twilio SMS (선택사항)

| Secret Name          | Value           | 비고                     |
| -------------------- | --------------- | ------------------------ |
| `TWILIO_ACCOUNT_SID` | `[사용자 설정]` | Twilio 계정 SID          |
| `TWILIO_AUTH_TOKEN`  | `[사용자 설정]` | Twilio 인증 토큰         |
| `TWILIO_SERVICE_SID` | `[사용자 설정]` | Twilio Verify 서비스 SID |

## 🌐 애플리케이션 URL (현재 설정)

| Secret Name           | Value                    | 비고                |
| --------------------- | ------------------------ | ------------------- |
| `CORS_ORIGIN`         | `http://210.117.237.104` | 도메인 설정 후 변경 |
| `NEXT_PUBLIC_API_URL` | `http://210.117.237.104` | 도메인 설정 후 변경 |
| `NEXT_PUBLIC_APP_URL` | `http://210.117.237.104` | 도메인 설정 후 변경 |

---

## 🔔 GitHub Variables (Secrets 아님)

**Settings → Secrets and variables → Actions → Variables 탭**

| Variable Name       | Value                                               | 비고     |
| ------------------- | --------------------------------------------------- | -------- |
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/services/YOUR/WEBHOOK/URL` | 선택사항 |

---

## ✅ 설정 체크리스트

### 🔗 즉시 설정 가능 (15개)

- [x] `SERVER_HOST` = `210.117.237.104`
- [x] `SERVER_USERNAME` = `kamf`
- [x] `SERVER_PORT` = `12022`
- [x] `SERVER_SSH_KEY` = `[생성된 SSH 개인키]`
- [x] `JWT_SECRET` = `[생성됨]`
- [x] `REFRESH_TOKEN_SECRET` = `[생성됨]`
- [x] `NEXTAUTH_SECRET` = `[생성됨]`
- [x] `CORS_ORIGIN` = `http://210.117.237.104`
- [x] `NEXT_PUBLIC_API_URL` = `http://210.117.237.104`
- [x] `NEXT_PUBLIC_APP_URL` = `http://210.117.237.104`

### 📝 사용자가 설정해야 할 항목 (5개)

- [ ] `DOCKERHUB_USERNAME` - Docker Hub 계정 생성 후 설정
- [ ] `DOCKERHUB_TOKEN` - Docker Hub Access Token 생성
- [ ] `DB_PASSWORD` - 강력한 데이터베이스 비밀번호
- [ ] `MYSQL_ROOT_PASSWORD` - MySQL root 비밀번호
- [ ] `TWILIO_*` - Twilio SMS 사용 시 (선택사항)

### 🎯 선택사항 (2개)

- [ ] `SLACK_WEBHOOK_URL` - Slack 알림 원할 시
- [ ] Twilio SMS 관련 Secrets

---

## 🚀 설정 후 테스트

```bash
# 1. dev 브랜치 배포 테스트
git checkout dev
git commit --allow-empty -m "test: dev deployment"
git push origin dev

# 2. GitHub Actions 확인
# - Docker Build & Push 워크플로우 성공
# - Deploy to Server 워크플로우 성공

# 3. 배포 확인
# http://210.117.237.104:8001 (dev)
# http://210.117.237.104:8000 (main)
```
