# Next.js Web용 Dockerfile  
FROM node:18-alpine AS base

# pnpm 설치 및 작업 디렉토리 설정
WORKDIR /app
RUN corepack enable pnpm

# 종속성 설치 단계
FROM base AS deps

# package.json 파일들 복사 (workspace 구조 고려)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/interface/package.json ./packages/interface/

# 종속성 설치 (frozen lockfile 사용)
RUN pnpm install --frozen-lockfile

# 빌드 단계
FROM base AS builder

# 소스 코드 전체 복사
COPY . .

# pnpm workspace 완전 설치 (각 패키지의 node_modules 설정)
RUN pnpm install --frozen-lockfile

# GitHub Actions에서 주입될 환경변수들 (빌드 시점에 필요)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Next.js 빌드 실행
# 의존성 순서대로 빌드 (interface -> web)
RUN pnpm --filter @kamf/interface build
RUN pnpm --filter @kamf/web build

# 런타임 단계
FROM node:18-alpine AS runner
WORKDIR /app

# 프로덕션 환경 설정
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 보안을 위한 non-root 사용자 생성
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 헬스체크를 위한 wget 설치 (curl 대신 wget 사용)
RUN apk add --no-cache wget

# Next.js 빌드 결과물 복사 (standalone 모드 가정)
# public 폴더 복사
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public

# standalone 빌드 결과물 복사 (.next/standalone)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# 정적 파일 복사 (.next/static)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

# nextjs 사용자로 전환
USER nextjs

# 포트 노출
EXPOSE 3000

# 헬스체크 설정
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Next.js 서버 시작
CMD ["node", "server.js"]
