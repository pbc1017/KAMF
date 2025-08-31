#!/bin/bash
#
# KAMF 프로덕션 배포 스크립트
# 이 스크립트는 GitHub Actions CD 파이프라인에서 호출됩니다.
#
set -e  # 오류 발생 시 즉시 종료

# 색상 출력 함수
print_info() {
    echo -e "\033[1;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

print_error() {
    echo -e "\033[1;31m[ERROR]\033[0m $1"
}

print_warning() {
    echo -e "\033[1;33m[WARNING]\033[0m $1"
}

# 배포 시작
print_info "=== KAMF Production Deployment Started ==="

# 환경변수 파일 확인 및 로드
if [ ! -f .env.deploy ]; then
    print_error "Environment file .env.deploy not found!"
    exit 1
fi

print_info "Loading environment variables..."
export $(cat .env.deploy | grep -v '^#' | xargs)

# 필수 환경변수 확인
REQUIRED_VARS=("DOCKER_REGISTRY" "IMAGE_TAG" "DB_PASSWORD" "JWT_SECRET")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set!"
        exit 1
    fi
done

print_success "Environment variables loaded successfully"
print_info "Docker Registry: $DOCKER_REGISTRY"
print_info "Image Tag: $IMAGE_TAG"
print_info "Deployment Time: ${DEPLOYMENT_TIME:-$(date '+%Y%m%d_%H%M%S')}"

# Docker Compose 파일 확인
if [ ! -f deploy/docker-compose.yml ]; then
    print_error "docker-compose.yml file not found in deploy/ directory!"
    exit 1
fi

cd deploy

# 현재 컨테이너 상태 백업
print_info "Backing up current container state..."
if docker-compose ps > .deployment-backup-$(date +%Y%m%d_%H%M%S); then
    print_success "Container state backed up"
else
    print_warning "Failed to backup container state (continuing anyway)"
fi

# 최신 이미지 Pull
print_info "Pulling latest Docker images..."
if ! docker pull ${DOCKER_REGISTRY}/kamf-api:${IMAGE_TAG}; then
    print_error "Failed to pull API image: ${DOCKER_REGISTRY}/kamf-api:${IMAGE_TAG}"
    exit 1
fi

if ! docker pull ${DOCKER_REGISTRY}/kamf-web:${IMAGE_TAG}; then
    print_error "Failed to pull Web image: ${DOCKER_REGISTRY}/kamf-web:${IMAGE_TAG}"
    exit 1
fi

print_success "All images pulled successfully"

# 기존 컨테이너 중지 (MySQL은 유지)
print_info "Stopping application containers (keeping MySQL running)..."
docker-compose stop api web nginx || true

# 새 컨테이너 시작
print_info "Starting updated containers..."
if ! docker-compose up -d; then
    print_error "Failed to start containers!"
    
    # 롤백 시도
    print_warning "Attempting to rollback..."
    docker-compose down || true
    if [ -f .deployment-backup-* ]; then
        print_info "Rolling back to previous state..."
        # 간단한 롤백: 기존 이미지로 다시 시작
        docker-compose up -d || print_error "Rollback failed!"
    fi
    exit 1
fi

print_success "Containers started successfully"

# 서비스 준비 대기
print_info "Waiting for services to be ready..."
WAIT_TIME=0
MAX_WAIT=60

while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    # API 컨테이너 상태 확인
    if docker-compose ps api | grep -q "Up"; then
        break
    fi
    
    sleep 2
    WAIT_TIME=$((WAIT_TIME + 2))
    print_info "Waiting... (${WAIT_TIME}s/${MAX_WAIT}s)"
done

if [ $WAIT_TIME -ge $MAX_WAIT ]; then
    print_error "Services did not start within $MAX_WAIT seconds!"
    docker-compose logs
    exit 1
fi

# 컨테이너 헬스체크
print_info "Performing container health checks..."

# API 컨테이너 체크
if ! docker-compose ps api | grep -q "Up"; then
    print_error "API container is not running!"
    docker-compose logs api
    exit 1
fi

# Web 컨테이너 체크  
if ! docker-compose ps web | grep -q "Up"; then
    print_error "Web container is not running!"
    docker-compose logs web
    exit 1
fi

# MySQL 컨테이너 체크
if ! docker-compose ps mysql | grep -q "Up"; then
    print_error "MySQL container is not running!"
    docker-compose logs mysql
    exit 1
fi

# Nginx 컨테이너 체크
if ! docker-compose ps nginx | grep -q "Up"; then
    print_error "Nginx container is not running!"
    docker-compose logs nginx
    exit 1
fi

print_success "All containers are running"

# 애플리케이션 레벨 헬스체크
print_info "Performing application health checks..."

# 내부 API 헬스체크 (컨테이너 내부에서)
HEALTH_CHECK_ATTEMPTS=0
MAX_HEALTH_ATTEMPTS=15

while [ $HEALTH_CHECK_ATTEMPTS -lt $MAX_HEALTH_ATTEMPTS ]; do
    if docker-compose exec -T api curl -f http://localhost:8000/health > /dev/null 2>&1; then
        print_success "API health check passed"
        break
    fi
    
    HEALTH_CHECK_ATTEMPTS=$((HEALTH_CHECK_ATTEMPTS + 1))
    print_info "Health check attempt $HEALTH_CHECK_ATTEMPTS/$MAX_HEALTH_ATTEMPTS"
    sleep 2
done

if [ $HEALTH_CHECK_ATTEMPTS -ge $MAX_HEALTH_ATTEMPTS ]; then
    print_error "API health check failed after $MAX_HEALTH_ATTEMPTS attempts"
    docker-compose logs api
    exit 1
fi

# Web 애플리케이션 헬스체크
if docker-compose exec -T web wget --spider -q http://localhost:3000/ > /dev/null 2>&1; then
    print_success "Web application health check passed"
else
    print_warning "Web application internal health check failed (but continuing)"
fi

# 배포 후 정리
print_info "Performing post-deployment cleanup..."

# 오래된 백업 파일 제거 (7일 이상)
find . -name ".deployment-backup-*" -mtime +7 -delete 2>/dev/null || true

# 사용하지 않는 Docker 볼륨 정리 (선택적)
docker volume prune -f || true

print_success "Cleanup completed"

# 배포 완료 로그
print_success "=== KAMF Production Deployment Completed ==="
print_info "Deployment Summary:"
print_info "  - Docker Registry: $DOCKER_REGISTRY"
print_info "  - Image Tag: $IMAGE_TAG"
print_info "  - Deployed By: ${DEPLOYED_BY:-Unknown}"
print_info "  - Commit SHA: ${COMMIT_SHA:-Unknown}"
print_info "  - Deployment Time: ${DEPLOYMENT_TIME:-$(date '+%Y-%m-%d %H:%M:%S')}"

# 현재 실행 중인 컨테이너 상태 출력
print_info "Current container status:"
docker-compose ps

exit 0
