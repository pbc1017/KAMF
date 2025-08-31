# 🐳 Docker Hub 설정 가이드

## 1️⃣ 계정 생성

1. **Docker Hub 접속**: https://hub.docker.com
2. **Sign Up** 클릭
3. **계정 정보 입력**:
   - Username: `your-username` (GitHub Secrets에 사용될 값)
   - Email: 본인 이메일
   - Password: 강력한 비밀번호
4. **이메일 인증** 완료

## 2️⃣ Public Repository 생성 (2개 필요)

### KAMF API Repository

1. **Create Repository** 클릭
2. **Repository Name**: `kamf-api`
3. **Visibility**: Public (무료)
4. **Description**: `KAMF API Server Container`
5. **Create** 클릭

### KAMF Web Repository

1. **Create Repository** 클릭
2. **Repository Name**: `kamf-web`
3. **Visibility**: Public (무료)
4. **Description**: `KAMF Web Application Container`
5. **Create** 클릭

## 3️⃣ Access Token 생성

1. **Account Settings** (우상단 프로필) 클릭
2. **Security** 탭 선택
3. **New Access Token** 클릭
4. **Token 설정**:
   - Access Token Description: `KAMF GitHub Actions`
   - Access permissions: `Read, Write, Delete`
5. **Generate** 클릭
6. **⚠️ 중요**: 생성된 토큰을 즉시 복사 (다시 볼 수 없음)

## 4️⃣ GitHub Secrets 설정

### GitHub 레포지토리에서 설정할 값들:

```bash
# Docker Hub 인증
DOCKERHUB_USERNAME=your-docker-hub-username
DOCKERHUB_TOKEN=dckr_pat_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🎯 생성될 Docker 이미지들

GitHub Actions에서 자동으로 다음 이미지들이 생성됩니다:

### Main 브랜치 (Production)

- `your-username/kamf-api:latest`
- `your-username/kamf-api:{commit-sha}`
- `your-username/kamf-web:latest`
- `your-username/kamf-web:{commit-sha}`

### Dev 브랜치 (Development)

- `your-username/kamf-api:dev`
- `your-username/kamf-web:dev`

## ⚠️ 주의사항

1. **Username 정확히 기록**: GitHub Secrets에서 대소문자 구분
2. **Access Token 보안**: 토큰을 안전하게 보관
3. **Repository 이름**: 반드시 `kamf-api`, `kamf-web`로 생성
4. **Public Repository**: Private는 유료 (Pull 횟수 제한 있음)

## 🔍 설정 확인 방법

1. **Repository 확인**: Docker Hub에서 2개 Repository 생성됨
2. **Token 확인**: Security 탭에서 생성된 토큰 확인
3. **GitHub Secrets**: Settings → Secrets에서 2개 값 설정
4. **테스트**: `git push origin dev`로 이미지 빌드 확인
