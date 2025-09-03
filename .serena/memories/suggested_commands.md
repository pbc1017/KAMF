# KAMF 개발 명령어 가이드

## 🚀 프로젝트 설정 및 시작

### 초기 설정

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp env.example .env

# 데이터베이스 시작 (Docker)
pnpm db:up

# 전체 빌드
pnpm build
```

### 개발 서버 실행

```bash
# 모든 앱 동시 실행 (web + api)
pnpm dev


# 개별 앱 실행
pnpm --filter @kamf/web dev     # 웹: http://localhost:3000
pnpm --filter @kamf/api dev     # API: http://localhost:3001

# 빠른 실행 (alias)
pnpm web dev                    # 웹만
pnpm api dev                    # API만
```

## 🏗️ 빌드 및 배포

### 빌드

```bash
# 전체 빌드
pnpm build

# 개별 빌드
pnpm --filter @kamf/web build
pnpm --filter @kamf/api build
pnpm --filter @kamf/interface build
```

### 프로덕션 실행

```bash
# 전체 시작
pnpm start

# 개별 시작
pnpm --filter @kamf/web start
pnpm --filter @kamf/api start
```

## 🗄️ 데이터베이스 관리

### Docker 기반 MySQL

```bash
# 데이터베이스 시작
pnpm db:up

# 데이터베이스 중지
pnpm db:down

# 데이터베이스 재시작
pnpm db:restart

# 로그 확인
pnpm db:logs

# 완전 초기화 (데이터 삭제)
pnpm db:reset

# MySQL CLI 접속
pnpm db:cli

# 상태 확인
pnpm db:status
```

### TypeORM 마이그레이션

```bash
# 마이그레이션 생성 (엔티티 변경사항 기반)
pnpm migration:generate -- src/migrations/YourMigrationName

# 빈 마이그레이션 파일 생성
pnpm migration:create -- src/migrations/YourMigrationName

# 마이그레이션 실행
pnpm migration:run

# 마이그레이션 되돌리기
pnpm migration:revert

# 마이그레이션 상태 확인
pnpm migration:show
```

## 🧹 코드 품질 관리

### 린팅

```bash
# 전체 프로젝트 린트 검사
pnpm lint

# 자동 수정
pnpm lint:fix

# 개별 앱 린트
pnpm --filter @kamf/web lint
pnpm --filter @kamf/api lint
```

### 포매팅

```bash
# 전체 프로젝트 포맷
pnpm format

# 포맷 검사만 (CI용)
pnpm format:check

# 개별 앱 포맷
pnpm --filter @kamf/web format
```

## 🧪 테스트 (API 전용)

```bash
# 단위 테스트 실행
pnpm --filter @kamf/api test

# 테스트 감시 모드
pnpm --filter @kamf/api test:watch

# 커버리지 포함 테스트
pnpm --filter @kamf/api test:cov

# E2E 테스트
pnpm --filter @kamf/api test:e2e

# 테스트 디버깅
pnpm --filter @kamf/api test:debug
```

## 🧽 정리 및 유지보수

```bash
# 전체 정리 (node_modules, dist, .next 등)
pnpm clean

# 개별 정리
pnpm --filter @kamf/web clean
pnpm --filter @kamf/api clean
pnpm --filter @kamf/interface clean
```

## 🖥️ Darwin (macOS) 시스템 유틸리티

```bash
# 파일 검색
find . -name "*.ts" -type f

# 내용 검색
grep -r "searchterm" src/

# 디렉토리 구조 확인
tree -I node_modules

# 포트 사용 확인
lsof -i :3000
lsof -i :3001

# 프로세스 종료
killall node

# 디스크 사용량 확인
du -sh *

# 파일 권한 확인
ls -la
```

## 🔍 개발 유틸리티

```bash
# API 문서 확인 (서버 실행 후)
open http://localhost:3001/api

# 웹 앱 열기
open http://localhost:3000

# 패키지 의존성 확인
pnpm list

# 패키지 업데이트 확인
pnpm outdated

# 특정 패키지 설치 (워크스페이스)
pnpm --filter @kamf/web add package-name
pnpm --filter @kamf/api add package-name
```

## 📦 Docker 배포 (선택사항)

```bash
# 로컬 Docker 환경
cd deploy
docker-compose -f docker-compose.yml -f docker-compose.local.yml up

# 개발 환경 배포
./scripts/deploy-dev.sh

# 프로덕션 배포
./scripts/deploy-prod.sh
```
