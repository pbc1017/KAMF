#!/bin/bash
#
# KAMF 개발 환경 배포 스크립트
# Docker MySQL을 사용한 개발 서버 배포
#
set -e

# 스크립트 디렉토리 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 공통 함수 로드
source "${SCRIPT_DIR}/deploy-common.sh"

# =====================================
# 개발 환경 설정
# =====================================
ENVIRONMENT="development"
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.dev.yml"
DEFAULT_PROJECT_NAME="kamf-dev"
DEFAULT_MYSQL_PORT="23306"
DEFAULT_API_PORT="8001"
DEFAULT_WEB_PORT="3001"
DEFAULT_DB_NAME="kamf_dev"

print_header "KAMF 개발 환경 배포 시작"

# =====================================
# 환경변수 로드 및 검증
# =====================================
print_info "환경변수 로드 중..."

# .env.deploy 파일 로드
if ! load_env_file; then
    exit 1
fi

# 환경변수 설정 (기본값 사용)
PROJECT_NAME="${DEPLOY_PATH:-$DEFAULT_PROJECT_NAME}"
MYSQL_PORT="${DB_EXTERNAL_PORT:-$DEFAULT_MYSQL_PORT}"
API_PORT="${API_PORT:-$DEFAULT_API_PORT}"
WEB_PORT="${WEB_PORT:-$DEFAULT_WEB_PORT}"
DB_NAME="${DB_NAME:-$DEFAULT_DB_NAME}"

# 필수 환경변수 확인
REQUIRED_VARS=("DOCKER_REGISTRY" "IMAGE_TAG" "DB_PASSWORD" "JWT_SECRET")
check_required_vars "${REQUIRED_VARS[@]}"

print_success "환경변수 로드 완료"
print_info "프로젝트: $PROJECT_NAME"
print_info "MySQL 포트: $MYSQL_PORT"
print_info "API 포트: $API_PORT"
print_info "Web 포트: $WEB_PORT"
print_info "데이터베이스: $DB_NAME"

# =====================================
# Docker Compose 파일 확인
# =====================================
print_info "Docker Compose 파일 확인..."

if [ ! -f "deploy/docker-compose.yml" ]; then
    print_error "docker-compose.yml을 찾을 수 없습니다!"
    exit 1
fi

if [ ! -f "deploy/docker-compose.dev.yml" ]; then
    print_error "docker-compose.dev.yml을 찾을 수 없습니다!"
    exit 1
fi

cd deploy || exit 1

# =====================================
# 컨테이너 상태 백업
# =====================================
backup_container_state "$PROJECT_NAME"

# =====================================
# Docker 이미지 Pull
# =====================================
print_info "최신 Docker 이미지 가져오는 중..."

# API 이미지 Pull
if ! docker pull "${DOCKER_REGISTRY}/kamf-api:${IMAGE_TAG}"; then
    print_error "API 이미지를 가져올 수 없습니다: ${DOCKER_REGISTRY}/kamf-api:${IMAGE_TAG}"
    exit 1
fi

# Web 이미지 Pull
if ! docker pull "${DOCKER_REGISTRY}/kamf-web:${IMAGE_TAG}"; then
    print_error "Web 이미지를 가져올 수 없습니다: ${DOCKER_REGISTRY}/kamf-web:${IMAGE_TAG}"
    exit 1
fi

print_success "모든 이미지를 성공적으로 가져왔습니다"

# =====================================
# Docker MySQL 시작 및 확인
# =====================================
print_info "Docker MySQL 시작 및 확인..."

if ! ensure_docker_mysql "$COMPOSE_FILES" "$PROJECT_NAME" "$MYSQL_PORT"; then
    print_error "Docker MySQL 시작에 실패했습니다"
    exit 1
fi

# =====================================
# 애플리케이션 컨테이너 관리
# =====================================
print_info "애플리케이션 컨테이너 중지 중..."
docker-compose -p "${PROJECT_NAME}" ${COMPOSE_FILES} stop api web || true

print_info "기존 애플리케이션 컨테이너 제거 중..."
docker-compose -p "${PROJECT_NAME}" ${COMPOSE_FILES} rm -f api web || true

# Docker 정리
docker_cleanup

# =====================================
# 이미지 메타데이터 검증
# =====================================
print_info "Docker 이미지 메타데이터 검증 중..."

# API 이미지 검증
if ! docker inspect "${DOCKER_REGISTRY}/kamf-api:${IMAGE_TAG}" > /dev/null 2>&1; then
    print_warning "API 이미지 검증 실패! 다시 가져오는 중..."
    docker pull "${DOCKER_REGISTRY}/kamf-api:${IMAGE_TAG}"
fi

# Web 이미지 검증
if ! docker inspect "${DOCKER_REGISTRY}/kamf-web:${IMAGE_TAG}" > /dev/null 2>&1; then
    print_warning "Web 이미지 검증 실패! 다시 가져오는 중..."
    docker pull "${DOCKER_REGISTRY}/kamf-web:${IMAGE_TAG}"
fi

# =====================================
# 새 컨테이너 시작
# =====================================
print_info "새로운 애플리케이션 컨테이너 시작 중..."

if ! docker-compose -p "${PROJECT_NAME}" ${COMPOSE_FILES} up -d --no-deps api web 2>/dev/null; then
    print_warning "컨테이너 시작 실패! ContainerConfig 에러로 인한 강제 복구 시도..."
    
    # 강제 복구 실행 (MySQL은 보호됨)
    force_container_recovery "$PROJECT_NAME" "$COMPOSE_FILES"
    
    # MySQL 상태 확인 및 조건부 복구 (새로운 안전 로직)
    if ! ensure_docker_mysql "$COMPOSE_FILES" "$PROJECT_NAME" "$MYSQL_PORT"; then
        print_error "MySQL 복구 실패"
        exit 1
    fi
    
    # DB 연결 검증 (환경변수 불일치 방지)
    if ! validate_db_connection "$PROJECT_NAME" "$COMPOSE_FILES" 3; then
        print_warning "DB 연결 검증 실패. 환경변수 문제 가능성"
    fi
    
    # 완전 재시작으로 복구 시도
    print_info "전체 서비스 완전 재시작 중..."
    if ! docker-compose -p "${PROJECT_NAME}" ${COMPOSE_FILES} up -d api web; then
        print_error "강제 복구 후에도 서비스 시작 실패"
        exit 1
    fi
fi

print_success "컨테이너가 성공적으로 시작되었습니다"

# =====================================
# 컨테이너 준비 대기
# =====================================
print_info "컨테이너 준비 대기 중..."

# API 컨테이너 준비 대기
if ! wait_for_container_ready "$PROJECT_NAME" "api"; then
    print_error "API 컨테이너가 준비되지 않았습니다"
    docker-compose -p "${PROJECT_NAME}" ${COMPOSE_FILES} logs api
    exit 1
fi

# Web 컨테이너 준비 대기  
if ! wait_for_container_ready "$PROJECT_NAME" "web"; then
    print_error "Web 컨테이너가 준비되지 않았습니다"
    docker-compose -p "${PROJECT_NAME}" ${COMPOSE_FILES} logs web
    exit 1
fi

print_success "모든 컨테이너가 실행 중입니다"

# =====================================
# 애플리케이션 헬스체크
# =====================================
print_info "애플리케이션 헬스체크 수행 중..."

# 서비스 안정화 대기
sleep 5

if ! check_application_health "$PROJECT_NAME" "$API_PORT" "$WEB_PORT"; then
    print_error "애플리케이션 헬스체크 실패"
    docker-compose -p "${PROJECT_NAME}" ${COMPOSE_FILES} logs
    exit 1
fi

# =====================================
# 외부 접근 테스트
# =====================================
test_external_access "$API_PORT" "$WEB_PORT"

# =====================================
# 배포 후 정리
# =====================================
print_info "배포 후 정리 작업 중..."

cleanup_old_backups

# =====================================
# 배포 완료 리포트
# =====================================
DOMAIN="${DOMAIN:-dev.kamf.site}"

print_deployment_summary \
    "$ENVIRONMENT" \
    "$PROJECT_NAME" \
    "$DOMAIN" \
    "$DB_NAME" \
    "$API_PORT" \
    "$WEB_PORT"

print_success "🎉 KAMF 개발 환경 배포가 성공적으로 완료되었습니다!"
print_info "개발 서버 접속 정보:"
print_info "  🌐 웹사이트: https://${DOMAIN}:${WEB_PORT}"
print_info "  🔗 API: https://${DOMAIN}:${API_PORT}"
print_info "  📚 API 문서: https://${DOMAIN}:${API_PORT}/api"
print_info "  🗄️ MySQL: ${DOMAIN}:${MYSQL_PORT}"

exit 0
