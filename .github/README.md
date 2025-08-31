# GitHub Actions 워크플로우 설정 가이드

## 📋 워크플로우 개요

KAMF 프로젝트는 두 개의 주요 GitHub Actions 워크플로우를 사용합니다:

1. **`ci.yml`** - 코드 품질 검사 (빌드, 린트, 테스트)
2. **`docker-build.yml`** - Docker 이미지 빌드 & Docker Hub 푸시
3. **`deploy.yml`** - SSH 서버 자동 배포

## 🔑 필수 GitHub Secrets

### 🐳 Docker Registry
| Secret | 설명 | 예시 |
|--------|------|------|
| `DOCKERHUB_USERNAME` | Docker Hub 사용자명 | `myusername` |
| `DOCKERHUB_TOKEN` | Docker Hub 액세스 토큰 | `dckr_pat_...` |

### 🖥️ 서버 연결 정보
| Secret | 설명 | 예시 |
|--------|------|------|
| `SERVER_HOST` | 서버 IP 주소 또는 도메인 | `123.45.67.89` |
| `SERVER_USERNAME` | SSH 사용자명 | `ubuntu` |
| `SERVER_SSH_KEY` | SSH 개인키 전체 내용 | `-----BEGIN RSA PRIVATE KEY-----\n...` |
| `SERVER_PORT` | SSH 포트 (기본값: 22) | `22` |

### 🌐 애플리케이션 URL
| Secret | 설명 | 예시 |
|--------|------|------|
| `CORS_ORIGIN_PROD` | 프로덕션 CORS 허용 도메인 | `https://kamf.example.com` |
| `NEXT_PUBLIC_API_URL_PROD` | 프로덕션 API URL | `https://kamf.example.com` |
| `NEXT_PUBLIC_APP_URL_PROD` | 프로덕션 웹앱 URL | `https://kamf.example.com` |
| `NEXT_PUBLIC_API_URL_DEV` | 개발 API URL | `https://dev-kamf.example.com` |
| `NEXT_PUBLIC_APP_URL_DEV` | 개발 웹앱 URL | `https://dev-kamf.example.com` |

### 🗄️ 데이터베이스
| Secret | 설명 | 예시 |
|--------|------|------|
| `DB_USERNAME` | MySQL 사용자명 | `kamf_user` |
| `DB_PASSWORD` | MySQL 사용자 비밀번호 | `[보안 패스워드]` |
| `DB_NAME` | 데이터베이스 이름 | `kamf_prod` |
| `MYSQL_ROOT_PASSWORD` | MySQL root 비밀번호 | `[보안 루트 패스워드]` |

### 🔐 JWT 및 인증
| Secret | 설명 | 생성 방법 |
|--------|------|----------|
| `JWT_SECRET` | JWT 서명 키 | `openssl rand -base64 32` |
| `REFRESH_TOKEN_SECRET` | 리프레시 토큰 키 | `openssl rand -base64 32` |
| `NEXTAUTH_SECRET` | NextAuth 시크릿 | `openssl rand -base64 32` |

### 📱 Twilio SMS
| Secret | 설명 | 예시 |
|--------|------|------|
| `TWILIO_ACCOUNT_SID` | Twilio 계정 SID | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Twilio 인증 토큰 | `[토큰값]` |
| `TWILIO_SERVICE_SID` | Twilio Verify 서비스 SID | `VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |

## 🔧 GitHub Variables (선택사항)

| Variable | 설명 | 예시 |
|----------|------|------|
| `SLACK_WEBHOOK_URL` | Slack 알림 웹훅 URL | `https://hooks.slack.com/services/...` |

## 🚀 설정 방법

### 1. GitHub 저장소에서 Secrets 설정

1. GitHub 저장소로 이동
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** 클릭
4. 위 표의 Secret 이름과 값을 입력

### 2. SSH 키 생성 및 설정

```bash
# SSH 키 생성
ssh-keygen -t rsa -b 4096 -C "github-actions@kamf" -f ~/.ssh/kamf_deploy_key

# 공개키를 서버에 등록
ssh-copy-id -i ~/.ssh/kamf_deploy_key.pub user@your-server-ip

# 개인키 내용을 GitHub Secrets에 등록
cat ~/.ssh/kamf_deploy_key | pbcopy  # macOS
cat ~/.ssh/kamf_deploy_key | xclip -selection clipboard  # Linux
```

### 3. Docker Hub 토큰 생성

1. Docker Hub에 로그인
2. **Account Settings** → **Security** → **New Access Token**
3. 토큰 이름: `github-actions-kamf`
4. 권한: **Read, Write, Delete**
5. 생성된 토큰을 `DOCKERHUB_TOKEN`에 저장

### 4. 보안 키 생성

```bash
# JWT 및 인증 키들 생성
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "REFRESH_TOKEN_SECRET=$(openssl rand -base64 32)"
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"

# 데이터베이스 패스워드 생성
echo "DB_PASSWORD=$(openssl rand -base64 24)"
echo "MYSQL_ROOT_PASSWORD=$(openssl rand -base64 24)"
```

## 📊 워크플로우 동작 방식

### CI 워크플로우 (`ci.yml`)
- **트리거**: 모든 브랜치에서 push/PR
- **작업**: 코드 품질 검사 (빌드, 린트, 테스트)
- **소요시간**: ~3-5분

### Docker Build 워크플로우 (`docker-build.yml`)
- **트리거**: `main`, `dev` 브랜치 push 또는 수동 실행
- **작업**: Docker 이미지 빌드 & Docker Hub 푸시
- **이미지 태그**:
  - `main` → `latest`
  - `dev` → `dev`
  - PR → 푸시 안함 (빌드만)
- **소요시간**: ~8-12분

### Deploy 워크플로우 (`deploy.yml`)
- **트리거**: Docker Build 성공 후 자동 또는 수동 실행
- **작업**: SSH 서버 배포, 헬스체크, 알림
- **대상 브랜치**: `main`만
- **소요시간**: ~3-5분

## 🔍 트러블슈팅

### 일반적인 오류

#### 1. Secret 접근 실패
```
Context access might be invalid: SOME_SECRET
```
**해결방법**: Secret 이름이 정확한지 확인하고, 저장소에 설정되어 있는지 확인

#### 2. Docker Hub 로그인 실패
```
Error: Cannot perform an interactive login from a non TTY device
```
**해결방법**: `DOCKERHUB_TOKEN`이 올바른지 확인하고, 토큰 권한이 충분한지 확인

#### 3. SSH 연결 실패
```
Permission denied (publickey)
```
**해결방법**: 
- SSH 키가 올바른지 확인
- 서버의 `~/.ssh/authorized_keys`에 공개키가 등록되었는지 확인
- 서버 방화벽에서 SSH 포트가 열려있는지 확인

#### 4. 배포 헬스체크 실패
```
Health check failed after 15 attempts
```
**해결방법**:
- 환경변수가 올바른지 확인
- 데이터베이스 연결 정보 확인
- 서버 리소스 충분한지 확인 (메모리, 디스크)

### 로그 확인 방법

1. **GitHub Actions**: Actions 탭에서 워크플로우 실행 로그 확인
2. **서버 로그**: SSH로 서버 접속 후 `docker-compose logs` 실행
3. **Slack 알림**: 배포 결과 자동 알림 (설정 시)

## 📝 보안 체크리스트

- [ ] 모든 민감정보를 GitHub Secrets에 저장
- [ ] SSH 키는 repository-specific으로 생성
- [ ] Docker Hub 토큰은 최소 권한으로 설정
- [ ] 서버는 SSH 키 인증만 허용
- [ ] 정기적으로 키와 토큰 교체
- [ ] 사용하지 않는 Secret 제거

---

**마지막 업데이트**: 2025년 1월