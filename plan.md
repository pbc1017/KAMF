# KAMF 프로젝트 배포 계획

## 📋 개요

k3s 기반 GitOps 배포를 목표로 하되, 점진적 접근을 통해 단계별로 배포 환경을 발전시키는 계획입니다.

### 🎯 전체 로드맵

- **Phase 1**: Docker Compose + Docker Hub (1-2주)
- **Phase 2**: 원격 서버 배포 (1-2주)
- **Phase 3**: k3s 클러스터 마이그레이션 (2-3주)
- **Phase 4**: ArgoCD GitOps 구현 (1-2주)

---

## 🏗️ 프로젝트 구조 설계

```
kamf/
├── apps/
│   ├── api/
│   │   ├── Dockerfile           # API 전용 Dockerfile
│   │   ├── package.json
│   │   └── src/
│   └── web/
│       ├── Dockerfile           # Web 전용 Dockerfile
│       ├── package.json
│       └── src/
├── deploy/                      # 배포 전용 폴더
│   ├── docker-compose.yml       # 단일 배포 설정
│   ├── nginx.conf              # Nginx 리버스 프록시 설정
│   └── scripts/
│       ├── deploy.sh           # 배포 스크립트
│       ├── setup-server.sh     # 서버 초기 설정
│       └── health-check.sh     # 헬스체크 스크립트
├── .env                        # 단일 환경변수 파일 (로컬 개발용)
├── .github/
│   └── workflows/
│       ├── ci.yml              # 이미지 빌드 & 푸시
│       └── deploy.yml          # SSH 서버 배포
├── package.json
└── README.md
```

---

## 🚀 Phase 1: Docker Compose + Docker Hub (1-2주)

### 목표

- 각 서비스의 컨테이너화
- Docker Hub를 통한 이미지 관리
- GitHub Actions CI 파이프라인 구축
- 로컬 및 원격 배포 환경 통합

### 1.1 각 패키지별 Dockerfile 작성

#### API Dockerfile (`apps/api/Dockerfile`)

- Multi-stage 빌드로 최적화
- Node.js 18-alpine 기반
- 보안을 위한 non-root 사용자 설정
- 헬스체크 포함

#### Web Dockerfile (`apps/web/Dockerfile`)

- Next.js standalone 빌드 활용
- 빌드 시 환경변수 주입 (GitHub Actions에서)
- 정적 파일 최적화
- 헬스체크 포함

### 1.2 배포 설정

#### Docker Compose (`deploy/docker-compose.yml`)

- MySQL, API, Web, Nginx 서비스 구성
- 환경변수 기반 설정 관리
- 헬스체크 및 의존성 관리
- 네트워크 분리 및 볼륨 관리

#### Nginx 리버스 프록시 (`deploy/nginx.conf`)

- API(/api)와 Web(/) 라우팅
- SSL/TLS 설정
- Gzip 압축 및 캐시 최적화
- 보안 헤더 설정

### 1.3 GitHub Actions CI 파이프라인

#### CI 워크플로우 (`.github/workflows/ci.yml`)

- Docker Hub 로그인 및 이미지 빌드
- Multi-platform 빌드 (amd64, arm64)
- 빌드 시 환경변수 주입
- 이미지 취약점 스캔 (Trivy)
- 캐시 최적화

### 1.4 환경변수 관리

- GitHub Secrets 기반 민감정보 관리
- 빌드 시점 환경변수 주입
- 런타임 환경변수 전달

---

## 🌐 Phase 2: SSH 서버 자동 배포 (1-2주)

### 목표

- SSH 연결 가능한 리눅스 서버에 자동 배포
- CI/CD 파이프라인을 통한 무중단 배포
- SSL 인증서 및 도메인 연결
- 기본적인 모니터링 설정

### 2.1 서버 환경 설정

#### 서버 초기 설정 (`deploy/scripts/setup-server.sh`)

- Docker & Docker Compose 설치
- Nginx 및 Certbot 설치
- 방화벽 설정 (UFW)
- SSL 인증서 자동 발급 및 갱신

### 2.2 자동 배포 시스템

#### CD 파이프라인 (`.github/workflows/deploy.yml`)

- CI 완료 후 자동 트리거
- 환경변수를 서버로 안전하게 전달
- SCP를 통한 설정 파일 업로드
- SSH를 통한 원격 배포 실행
- 배포 결과 Slack 알림

#### 배포 스크립트 (`deploy/scripts/deploy.sh`)

- 최신 이미지 풀 및 컨테이너 교체
- 헬스체크 및 롤백 기능
- 로그 관리 및 정리

### 2.3 보안 및 모니터링

- GitHub Secrets를 통한 민감정보 관리
- SSL/TLS 자동 갱신
- 기본적인 헬스체크 및 알림

---

## 📊 Phase 3: k3s 클러스터 (향후 계획)

### 목표

- Kubernetes 기반 스케일링 및 고가용성
- 컨테이너 오케스트레이션
- 영구 볼륨 및 ConfigMap/Secret 관리

### 주요 작업

- k3s 클러스터 설치 및 설정
- Docker Compose를 Kubernetes 매니페스트로 변환
- Ingress 컨트롤러 설정
- 영구 볼륨 및 스토리지 클래스 설정

---

## 🚀 Phase 4: ArgoCD GitOps (향후 계획)

### 목표

- Git 기반 배포 자동화
- 선언적 인프라 관리
- 다중 환경 관리

### 주요 작업

- ArgoCD 설치 및 설정
- GitOps 레포지토리 구조 설계
- Application 및 Project 정의
- Sealed Secrets 또는 External Secrets 설정

---

## ✅ Phase 1 & 2 실행 체크리스트

### Phase 1: 컨테이너화 (3-4일) ✅ **완료**

- [x] `apps/api/Dockerfile` 작성
- [x] `apps/web/Dockerfile` 작성
- [x] `deploy/docker-compose.yml` 작성
- [x] `deploy/nginx.conf` 작성
- [x] `.github/workflows/ci.yml` 작성 (코드 품질 검사)
- [x] `.github/workflows/docker-build.yml` 작성 (이미지 빌드/푸시)
- [x] GitHub Secrets 관리 체계 설계
- [x] `.github/README.md` GitHub Actions 가이드 작성
- [ ] Docker Hub 계정 생성 및 레포지토리 설정
- [ ] GitHub Secrets 실제 설정
- [ ] 로컬에서 전체 스택 테스트

### Phase 2: 서버 배포 (2-3일) ✅ **구현 완료**

- [x] `deploy/scripts/setup-server.sh` 서버 초기화 스크립트 작성
- [x] `.github/workflows/deploy.yml` CD 파이프라인 작성
- [x] `deploy/scripts/deploy.sh` 배포 실행 스크립트 작성
- [x] `deploy/README.md` 배포 가이드 작성
- [ ] SSH 서버 준비 및 접근 확인 (사용자 작업)
- [ ] 도메인 구매 및 DNS 설정 (선택사항)
- [ ] GitHub Secrets 설정 (서버 연결 정보)
- [ ] GitHub Secrets 설정 (애플리케이션 환경변수)
- [ ] 서버 초기화 스크립트 실행
- [ ] SSL 인증서 설정 (선택사항)
- [ ] 배포 테스트 및 헬스체크 확인
- [ ] Slack 알림 설정 (선택사항)

---

## 🔧 필수 GitHub Secrets

### Docker Registry

- `DOCKERHUB_USERNAME`: Docker Hub 사용자명
- `DOCKERHUB_TOKEN`: Docker Hub 액세스 토큰

### 서버 연결

- `SERVER_HOST`: 서버 IP 주소
- `SERVER_USERNAME`: SSH 사용자명
- `SERVER_SSH_KEY`: SSH 개인키
- `SERVER_PORT`: SSH 포트 (기본: 22)

### 애플리케이션 URL

- `CORS_ORIGIN`: CORS 허용 도메인
- `NEXT_PUBLIC_API_URL`: API 서버 URL
- `NEXT_PUBLIC_APP_URL`: 웹앱 URL

### 데이터베이스

- `DB_USERNAME`: MySQL 사용자명
- `DB_PASSWORD`: MySQL 사용자 비밀번호
- `DB_NAME`: 데이터베이스 이름
- `MYSQL_ROOT_PASSWORD`: MySQL root 비밀번호

### JWT 및 인증

- `JWT_SECRET`: JWT 서명 키
- `JWT_EXPIRES_IN`: JWT 만료 시간
- `REFRESH_TOKEN_SECRET`: 리프레시 토큰 키
- `REFRESH_TOKEN_EXPIRES_IN`: 리프레시 토큰 만료 시간

### Twilio SMS

- `TWILIO_ACCOUNT_SID`: Twilio 계정 SID
- `TWILIO_AUTH_TOKEN`: Twilio 인증 토큰
- `TWILIO_SERVICE_SID`: Twilio Verify 서비스 SID

### 알림 (선택사항)

- `SLACK_WEBHOOK_URL`: Slack 웹훅 URL

---

## 📝 주요 설계 원칙

1. **점진적 발전**: 단계별로 복잡도를 높여가며 안정성 확보
2. **단일 소스**: 환경변수와 설정의 중앙 집중화
3. **자동화 우선**: 수동 작업 최소화, CD 파이프라인 중심
4. **보안 강화**: GitHub Secrets 활용, non-root 사용자, SSL/TLS
5. **모니터링**: 헬스체크, 로깅, 알림 시스템 내장
6. **확장성**: 향후 k3s 및 GitOps 전환을 고려한 구조

---

## 🎯 다음 단계

Phase 1과 2를 완료한 후:

1. **성능 최적화**: 캐시 전략, 이미지 최적화
2. **모니터링 강화**: Prometheus, Grafana 추가
3. **백업 전략**: 데이터베이스 백업 자동화
4. **k3s 마이그레이션**: 컨테이너 오케스트레이션으로 전환
5. **GitOps 구현**: ArgoCD 기반 선언적 배포

---

_최종 업데이트: 2025년 1월_
