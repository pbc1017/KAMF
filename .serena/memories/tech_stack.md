# KAMF 기술 스택

## 모노레포 구조

- **패키지 매니저**: pnpm 8.15.0
- **워크스페이스**: pnpm workspaces
- **타입 시스템**: TypeScript 5.3.3 (엄격한 타입 검사)

## 프론트엔드 (apps/web)

- **프레임워크**: Next.js 14 (App Router)
- **UI 라이브러리**: React 18
- **스타일링**: Tailwind CSS
- **상태관리**: TanStack Query (React Query)
- **차트**: Recharts
- **알림**: React Hot Toast
- **포트**: 3000 (기본값)

## 백엔드 (apps/api)

- **프레임워크**: NestJS
- **ORM**: TypeORM
- **데이터베이스**: MySQL 8.0
- **인증**: JWT + Refresh Token
- **SMS**: Twilio
- **API 문서**: Swagger
- **포트**: 8000 (운영), 3001 (개발)

## 공유 패키지 (packages/interface)

- **역할**: 타입 및 인터페이스 공유
- **빌드**: TypeScript 컴파일
- **내용**: 사용자, 인증, 축제 관련 타입 정의

## 배포 및 인프라

- **컨테이너**: Docker
- **오케스트레이션**: Docker Compose
- **리버스 프록시**: Nginx
- **SSL**: Let's Encrypt
- **환경**: 개발/스테이징/프로덕션 분리

## 개발 도구

- **린터**: ESLint with TypeScript
- **포매터**: Prettier
- **테스트**: Jest (API 전용)
- **타입 검사**: TypeScript
- **Git Hook**: Husky + lint-staged
