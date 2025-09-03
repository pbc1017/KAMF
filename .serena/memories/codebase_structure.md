# KAMF 코드베이스 구조

## 📁 모노레포 최상위 구조

```
kamf/
├── apps/                      # 애플리케이션들
│   ├── web/                   # Next.js 프론트엔드
│   └── api/                   # NestJS 백엔드
├── packages/                  # 공유 패키지들
│   └── interface/             # 타입 정의
├── deploy/                    # Docker 배포 설정
├── mysql-init/               # MySQL 초기화 스크립트
├── 2024-kamf-safety/         # 2024년 안전 관련 별도 프로젝트
├── package.json              # 루트 워크스페이스 설정
├── pnpm-workspace.yaml       # pnpm 워크스페이스
├── tsconfig.json             # TypeScript 베이스 설정
├── .eslintrc.json           # ESLint 설정
├── .prettierrc.json         # Prettier 설정
└── env.example              # 환경 변수 템플릿
```

## 🌐 웹 앱 구조 (apps/web/)

```
web/
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # 루트 레이아웃
│   │   ├── page.tsx          # 홈 페이지
│   │   ├── login/            # 로그인 페이지
│   │   ├── safety/           # 안전 모니터링
│   │   ├── booth/            # 부스 관리
│   │   ├── map/              # 지도 (구역별)
│   │   ├── stages/           # 스테이지 관리
│   │   └── mypage/           # 마이페이지
│   ├── components/           # 재사용 컴포넌트
│   │   ├── auth/             # 인증 관련
│   │   ├── safety/           # 안전 관련
│   │   ├── guards/           # 권한 가드
│   │   └── ui/               # 기본 UI
│   ├── hooks/                # React hooks
│   ├── lib/                  # 유틸리티 라이브러리
│   └── providers/            # Context providers
├── public/                   # 정적 파일
├── tailwind.config.js        # Tailwind CSS 설정
└── next.config.js           # Next.js 설정
```

## 🔧 API 서버 구조 (apps/api/)

```
api/
├── src/
│   ├── main.ts               # 애플리케이션 엔트리포인트
│   ├── app.module.ts         # 루트 모듈
│   ├── entities/             # TypeORM 엔티티
│   │   ├── user.entity.ts    # 사용자
│   │   ├── booth.entity.ts   # 부스
│   │   ├── stage.entity.ts   # 스테이지
│   │   ├── safety-count.entity.ts # 안전 카운트
│   │   └── role.entity.ts    # 역할
│   ├── modules/              # 기능별 모듈
│   │   ├── auth/             # 인증 (JWT, SMS)
│   │   ├── users/            # 사용자 관리
│   │   ├── booth/            # 부스 관리
│   │   ├── stage/            # 스테이지 관리
│   │   └── safety/           # 안전 모니터링
│   ├── common/               # 공통 기능
│   │   ├── decorators/       # 데코레이터
│   │   ├── dto/              # 데이터 전송 객체
│   │   ├── entities/         # 베이스 엔티티
│   │   ├── guards/           # 가드 (인증, 권한)
│   │   ├── services/         # 공통 서비스
│   │   └── utils/            # 유틸리티
│   ├── config/               # 설정 파일
│   │   ├── database.config.ts # DB 설정
│   │   └── typeorm.config.ts  # TypeORM 설정
│   └── migrations/           # DB 마이그레이션
└── test/                     # 테스트 파일
```

## 📦 인터페이스 패키지 구조 (packages/interface/)

```
interface/
├── src/
│   ├── index.ts              # 메인 export
│   ├── dtos/                 # Data Transfer Objects
│   │   ├── auth.dto.ts       # 인증 관련
│   │   ├── user.dto.ts       # 사용자 관련
│   │   ├── festival.dto.ts   # 축제 관련
│   │   └── safety.dto.ts     # 안전 관련
│   └── types/                # 타입 정의
│       ├── auth.type.ts      # 인증 타입
│       ├── user.type.ts      # 사용자 타입
│       ├── common.type.ts    # 공통 타입
│       └── festival.type.ts  # 축제 타입
└── dist/                     # 컴파일된 결과물
```

## 🐳 배포 구조 (deploy/)

```
deploy/
├── docker-compose.yml        # 기본 Docker 설정
├── docker-compose.dev.yml    # 개발 환경
├── docker-compose.prod.yml   # 프로덕션 환경
├── docker-compose.local.yml  # 로컬 개발
├── nginx/                    # Nginx 설정
│   └── conf.d/              # 환경별 설정
├── scripts/                  # 배포 스크립트
│   ├── deploy-dev.sh        # 개발 배포
│   ├── deploy-prod.sh       # 프로덕션 배포
│   ├── setup-nginx.sh       # Nginx 설정
│   └── setup-ssl.sh         # SSL 설정
└── renew-ssl.sh             # SSL 갱신
```

## 📊 2024-kamf-safety 별도 프로젝트

```
2024-kamf-safety/            # 2024년도 안전 관련 별도 구현
├── packages/
│   ├── api/                 # NestJS API (Drizzle ORM)
│   ├── web/                 # Next.js 웹앱
│   └── interface/           # 공유 인터페이스
└── resource/                # 분석 자료 및 덤프 파일
```

## 🔍 주요 디렉토리별 역할

### 인증 및 사용자 관리

- `apps/api/src/modules/auth/`: JWT 토큰, SMS 인증
- `apps/api/src/modules/users/`: 사용자 CRUD, 역할 관리
- `apps/web/src/components/auth/`: 로그인 UI 컴포넌트

### 축제 관리

- `apps/api/src/modules/booth/`: 부스 정보 관리
- `apps/api/src/modules/stage/`: 스테이지 정보 관리
- `apps/web/src/app/booth/`, `apps/web/src/app/stages/`: 관리 UI

### 안전 모니터링

- `apps/api/src/modules/safety/`: 실시간 카운트, 캐싱
- `apps/web/src/app/safety/`: 모니터링 대시보드
- `apps/web/src/components/safety/`: 차트, 컨트롤 UI

### 공통 기능

- `packages/interface/`: 모든 앱에서 사용하는 타입 정의
- `apps/api/src/common/`: 가드, 데코레이터, 유틸리티
- `apps/web/src/components/ui/`: 재사용 가능한 UI 컴포넌트
