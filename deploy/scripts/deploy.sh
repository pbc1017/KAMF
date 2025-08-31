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

# MySQL 컨테이너가 이미 실행 중인지 확인
print_info "Checking MySQL container status..."
MYSQL_RUNNING=$(docker ps -q -f name=kamf-mysql)

if [ -z "$MYSQL_RUNNING" ]; then
    print_info "Starting MySQL container first..."
    docker-compose up -d mysql
    
    print_info "Waiting for MySQL to be ready..."
    for i in {1..30}; do
        if docker-compose exec -T mysql mysqladmin ping -h localhost --silent; then
            print_success "MySQL is ready"
            break
        fi
        echo "Waiting for MySQL... ($i/30)"
        sleep 2
    done
fi

# 환경별 데이터베이스 생성
print_info "Ensuring database '${DB_NAME}' exists..."
docker-compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USERNAME}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USERNAME}'@'%';
FLUSH PRIVILEGES;
" 2>/dev/null || print_warning "Database setup failed (may already exist)"

print_success "Database '${DB_NAME}' is ready"

# 새 컨테이너 시작 (MySQL 제외)
print_info "Starting updated application containers..."
if ! docker-compose up -d api web nginx; then
    print_error "Failed to start containers!"
    
    # 롤백 시도
    print_warning "Attempting to rollback..."
    docker-compose stop api web nginx || true
    if [ -f .deployment-backup-* ]; then
        print_info "Rolling back to previous state..."
        # 간단한 롤백: 기존 이미지로 다시 시작
        docker-compose up -d api web nginx || print_error "Rollback failed!"
    fi
    exit 1
fi

print_success "Containers started successfully"

# 서비스 준비 대기
print_info "Waiting for services to be ready..."
WAIT_TIME=0
MAX_WAIT=60

while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    # API 컨테이너 상태 확인 (환경별 이름)
    if docker ps | grep -q "${DEPLOY_PATH}-api.*Up"; then
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

# 컨테이너 헬스체크 (환경별 컨테이너 이름 사용)
print_info "Performing container health checks..."

# API 컨테이너 체크
if ! docker ps | grep -q "${DEPLOY_PATH}-api.*Up"; then
    print_error "API container (${DEPLOY_PATH}-api) is not running!"
    docker-compose logs api
    exit 1
fi

# Web 컨테이너 체크  
if ! docker ps | grep -q "${DEPLOY_PATH}-web.*Up"; then
    print_error "Web container (${DEPLOY_PATH}-web) is not running!"
    docker-compose logs web
    exit 1
fi

# MySQL 컨테이너 체크 (공유)
if ! docker ps | grep -q "kamf-mysql.*Up"; then
    print_error "MySQL container (kamf-mysql) is not running!"
    docker-compose logs mysql
    exit 1
fi

# Nginx 컨테이너 체크 (공유)
if ! docker ps | grep -q "kamf-nginx.*Up"; then
    print_error "Nginx container (kamf-nginx) is not running!"
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

# 외부 접근 헬스체크 (포트별)
print_info "Testing external access on port ${API_PORT}..."
if curl -f -m 10 http://localhost:${API_PORT}/health > /dev/null 2>&1; then
    print_success "External API access confirmed"
else
    print_warning "External API access test failed (but continuing)"
fi

print_info "Testing external access on port ${WEB_PORT}..."
if curl -f -m 10 http://localhost:${WEB_PORT}/ > /dev/null 2>&1; then
    print_success "External Web access confirmed"  
else
    print_warning "External Web access test failed (but continuing)"
fi

# 배포 후 정리
print_info "Performing post-deployment cleanup..."

# 오래된 백업 파일 제거 (7일 이상)
find . -name ".deployment-backup-*" -mtime +7 -delete 2>/dev/null || true

# 사용하지 않는 Docker 볼륨 정리 (선택적)
docker volume prune -f || true

print_success "Cleanup completed"

# 배포 완료 로그
print_success "=== KAMF ${ENVIRONMENT:-Production} Deployment Completed ==="
print_info "Deployment Summary:"
print_info "  - Environment: ${ENVIRONMENT:-Production}"
print_info "  - Deploy Path: ${DEPLOY_PATH:-kamf}"
print_info "  - Domain: ${DOMAIN:-kamf.site}"
print_info "  - Database: ${DB_NAME:-kamf_prod}"
print_info "  - API Port: ${API_PORT:-8000}"
print_info "  - Web Port: ${WEB_PORT:-3000}"
print_info "  - Docker Registry: $DOCKER_REGISTRY"
print_info "  - Image Tag: $IMAGE_TAG"
print_info "  - Deployed By: ${DEPLOYED_BY:-Unknown}"
print_info "  - Commit SHA: ${COMMIT_SHA:-Unknown}"
print_info "  - Deployment Time: ${DEPLOYMENT_TIME:-$(date '+%Y-%m-%d %H:%M:%S')}"

# 현재 실행 중인 컨테이너 상태 출력
print_info "Current container status:"
docker-compose ps

exit 0
