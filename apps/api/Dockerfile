# NestJS API용 Dockerfile
FROM node:18-alpine AS base

# 작업 디렉토리 설정
WORKDIR /app
RUN corepack enable pnpm

# 종속성 설치 단계
FROM base AS deps

# package.json 파일들 복사 (workspace 구조 고려)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/interface/package.json ./packages/interface/

# 종속성 설치 (frozen lockfile 사용)
RUN pnpm install --frozen-lockfile

# 빌드 단계
FROM base AS builder

# 소스 코드 전체 복사
COPY . .

# pnpm workspace 완전 설치 (각 패키지의 node_modules 설정)
RUN pnpm install --frozen-lockfile

# 의존성 순서대로 빌드 (interface -> api)
RUN pnpm --filter @kamf/interface build
RUN pnpm --filter @kamf/api build

# pnpm deploy를 사용한 production 배포
RUN pnpm --filter=@kamf/api deploy --prod /tmp/deploy-api

# 런타임 단계
FROM node:18-alpine AS runner
WORKDIR /app

# 보안을 위한 non-root 사용자 생성
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# 헬스체크를 위한 curl 설치
RUN apk add --no-cache curl

# 환경변수 설정
ENV NODE_ENV=production
ENV API_PORT=8000

# pnpm deploy 결과물 복사 (flat node_modules 구조)
COPY --from=builder --chown=nestjs:nodejs /tmp/deploy-api ./

# workspace 패키지를 tsconfig 경로에 맞게 복사 (../../packages -> ../packages)
RUN mkdir -p ../packages
COPY --from=builder --chown=nestjs:nodejs /app/packages ../packages

# nestjs 사용자로 전환
USER nestjs

# 포트 노출
EXPOSE 8000

# 헬스체크 설정
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# 애플리케이션 시작 (pnpm deploy 구조)
CMD ["node", "dist/main.js"]
