#!/bin/bash
#
# KAMF 운영 환경 배포 스크립트
# Docker MySQL을 사용한 운영 서버 배포 (보안 강화)
#
set -e

# 스크립트 디렉토리 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 공통 함수 로드
source "${SCRIPT_DIR}/deploy-common.sh"

# =====================================
# 운영 환경 설정
# =====================================
ENVIRONMENT="production"
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"
DEFAULT_PROJECT_NAME="kamf"
DEFAULT_MYSQL_PORT="13306"
DEFAULT_API_PORT="8000"
DEFAULT_WEB_PORT="3000"
DEFAULT_DB_NAME="kamf_prod"

print_header "KAMF 운영 환경 배포 시작"

# =====================================
# 운영 환경 사전 검증
# =====================================
print_info "운영 환경 사전 검증 수행 중..."

# 시스템 리소스 확인
AVAILABLE_MEMORY=$(free -m | awk 'NR==2{print $7}')
AVAILABLE_DISK=$(df -BM /var/lib/docker | awk 'NR==2{print $4}' | sed 's/M//')

if [ "$AVAILABLE_MEMORY" -lt 512 ]; then
    print_warning "사용 가능한 메모리가 부족합니다: ${AVAILABLE_MEMORY}MB"
fi

if [ "$AVAILABLE_DISK" -lt 2048 ]; then
    print_warning "사용 가능한 디스크 공간이 부족합니다: ${AVAILABLE_DISK}MB"
fi

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

# 필수 환경변수 확인 (운영 환경용 추가 검증)
REQUIRED_VARS=(
    "DOCKER_REGISTRY" 
    "IMAGE_TAG" 
    "DB_PASSWORD" 
    "JWT_SECRET"
    "REFRESH_TOKEN_SECRET"
    "MYSQL_ROOT_PASSWORD"
)
check_required_vars "${REQUIRED_VARS[@]}"

# 보안 변수 검증 (운영 환경)
if [ ${#DB_PASSWORD} -lt 12 ]; then
    print_warning "DB_PASSWORD가 12자 미만입니다. 보안을 위해 더 긴 패스워드 사용을 권장합니다."
fi

if [ ${#JWT_SECRET} -lt 32 ]; then
    print_warning "JWT_SECRET이 32자 미만입니다. 보안을 위해 더 긴 시크릿 사용을 권장합니다."
fi

print_success "환경변수 로드 및 검증 완료"
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

if [ ! -f "deploy/docker-compose.prod.yml" ]; then
    print_error "docker-compose.prod.yml을 찾을 수 없습니다!"
    exit 1
fi

cd deploy || exit 1

# =====================================
# 운영 환경 백업 (중요)
# =====================================
print_info "운영 환경 백업 수행 중..."

# 컨테이너 상태 백업
backup_container_state "$PROJECT_NAME"

# MySQL 데이터 백업 (Docker MySQL이 실행 중인 경우)
if docker-compose -p "${PROJECT_NAME}" ${COMPOSE_FILES} exec -T mysql mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "SELECT 1;" > /dev/null 2>&1; then
    BACKUP_FILE="mysql-backup-$(date +%Y%m%d_%H%M%S).sql"
    print_info "MySQL 데이터베이스 백업 생성 중: $BACKUP_FILE"
    
    if docker-compose -p "${PROJECT_NAME}" ${COMPOSE_FILES} exec -T mysql mysqldump -u root -p"${MYSQL_ROOT_PASSWORD}" --single-transaction --routines --triggers --all-databases > "$BACKUP_FILE" 2>/dev/null; then
        print_success "MySQL 백업 완료: $BACKUP_FILE"
    else
        print_warning "MySQL 백업 실패 (계속 진행)"
    fi
fi

# =====================================
# Docker 이미지 Pull 및 검증
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

# 이미지 보안 스캔 (선택적)
if command -v trivy &> /dev/null; then
    print_info "Docker 이미지 보안 스캔 수행 중..."
    trivy image --exit-code 0 --no-progress "${DOCKER_REGISTRY}/kamf-api:${IMAGE_TAG}" || print_warning "API 이미지 보안 스캔에서 문제가 발견되었습니다"
    trivy image --exit-code 0 --no-progress "${DOCKER_REGISTRY}/kamf-web:${IMAGE_TAG}" || print_warning "Web 이미지 보안 스캔에서 문제가 발견되었습니다"
fi

print_success "모든 이미지를 성공적으로 가져왔습니다"

# =====================================
# 이미지 메타데이터 검증 및 복구
# =====================================
print_info "Docker 이미지 메타데이터 검증 중..."

# API 이미지 검증
if ! docker inspect "${DOCKER_REGISTRY}/kamf-api:${IMAGE_TAG}" > /dev/null 2>&1; then
    print_warning "API 이미지 검증 실패! 다시 가져오는 중..."
    if ! docker pull "${DOCKER_REGISTRY}/kamf-api:${IMAGE_TAG}"; then
        print_error "API 이미지 재다운로드 실패"
        exit 1
    fi
fi

# Web 이미지 검증
if ! docker inspect "${DOCKER_REGISTRY}/kamf-web:${IMAGE_TAG}" > /dev/null 2>&1; then
    print_warning "Web 이미지 검증 실패! 다시 가져오는 중..."
    if ! docker pull "${DOCKER_REGISTRY}/kamf-web:${IMAGE_TAG}"; then
        print_error "Web 이미지 재다운로드 실패"
        exit 1
    fi
fi

print_success "이미지 메타데이터 검증 완료"

# =====================================
# Docker MySQL 시작 및 확인
# =====================================
print_info "Docker MySQL 시작 및 확인..."

if ! ensure_docker_mysql "$COMPOSE_FILES" "$PROJECT_NAME" "$MYSQL_PORT"; then
    print_error "Docker MySQL 시작에 실패했습니다"
    
    # MySQL 로그 확인
    print_info "MySQL 컨테이너 로그:"
    docker-compose -p "${PROJECT_NAME}" ${COMPOSE_FILES} logs mysql || true
    exit 1
fi

# =====================================
# 무중단 배포를 위한 단계별 컨테이너 교체
# =====================================
print_info "무중단 배포를 위한 단계별 컨테이너 교체 수행..."

# 현재 실행 중인 서비스 확인
CURRENT_API_RUNNING=$(docker ps --format "table {{.Names}}" | grep "${PROJECT_NAME}-api" || echo "")
CURRENT_WEB_RUNNING=$(docker ps --format "table {{.Names}}" | grep "${PROJECT_NAME}-web" || echo "")

if [ -n "$CURRENT_API_RUNNING" ] || [ -n "$CURRENT_WEB_RUNNING" ]; then
    print_info "현재 실행 중인 서비스가 있습니다. 롤링 업데이트 수행..."
    
    # API 먼저 업데이트 (데이터베이스 마이그레이션 등)
    if [ -n "$CURRENT_API_RUNNING" ]; then
        print_info "API 서비스 업데이트 중..."
        
        # API 업데이트 시도
        if ! docker-compose -p "${PROJECT_NAME}" ${COMPOSE_FILES} up -d --no-deps api 2>/dev/null; then
            print_warning "API 업데이트 실패! ContainerConfig 에러로 인한 강제 복구 시도..."
            
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
            
            # API만 다시 시작
            print_info "API 서비스 완전 재시작 중..."
            if ! docker-compose -p "${PROJECT_NAME}" ${COMPOSE_FILES} up -d api; then
                print_error "강제 복구 후에도 API 시작 실패"
                exit 1
            fi
        fi
        
        # API 준비 대기
        if ! wait_for_container_ready "$PROJECT_NAME" "api" 120; then
            print_error "새 API 컨테이너가 준비되지 않았습니다"
            docker-compose -p "${PROJECT_NAME}" ${COMPOSE_FILES} logs api
            exit 1
        fi
        
        # API 헬스체크
        if ! check_application_health "$PROJECT_NAME" "$API_PORT" "$WEB_PORT" 20; then
            print_error "새 API 컨테이너 헬스체크 실패"
            exit 1
        fi
        
        print_success "API 서비스 업데이트 완료"
    fi
    
    # Web 업데이트
    if [ -n "$CURRENT_WEB_RUNNING" ]; then
        print_info "Web 서비스 업데이트 중..."
        
        # Web 업데이트 시도
        if ! docker-compose -p "${PROJECT_NAME}" ${COMPOSE_FILES} up -d --no-deps web 2>/dev/null; then
            print_warning "Web 업데이트 실패! ContainerConfig 에러로 인한 강제 복구 시도..."
            
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
        
        # Web 준비 대기
        if ! wait_for_container_ready "$PROJECT_NAME" "web" 120; then
            print_error "새 Web 컨테이너가 준비되지 않았습니다"
            docker-compose -p "${PROJECT_NAME}" ${COMPOSE_FILES} logs web
            exit 1
        fi
        
        print_success "Web 서비스 업데이트 완료"
    fi
else
    print_info "새로운 배포: 모든 서비스 시작 중..."
    
    # 전체 서비스 시작
    if ! docker-compose -p "${PROJECT_NAME}" ${COMPOSE_FILES} up -d --no-deps api web 2>/dev/null; then
        print_warning "초기 서비스 시작 실패! 강제 복구 시도..."
        
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
    
    # 전체 서비스 준비 대기
    if ! wait_for_container_ready "$PROJECT_NAME" "api" 120; then
        print_error "API 컨테이너가 준비되지 않았습니다"
        exit 1
    fi
    
    if ! wait_for_container_ready "$PROJECT_NAME" "web" 120; then
        print_error "Web 컨테이너가 준비되지 않았습니다"
        exit 1
    fi
fi

print_success "모든 컨테이너 업데이트 완료"

# =====================================
# 포괄적 헬스체크 (운영 환경)
# =====================================
print_info "포괄적 헬스체크 수행 중..."

# 서비스 안정화 대기
sleep 10

# 애플리케이션 헬스체크
if ! check_application_health "$PROJECT_NAME" "$API_PORT" "$WEB_PORT" 30; then
    print_error "애플리케이션 헬스체크 실패"
    docker-compose -p "${PROJECT_NAME}" ${COMPOSE_FILES} logs
    exit 1
fi

# 외부 접근 테스트
test_external_access "$API_PORT" "$WEB_PORT" 10

# 데이터베이스 연결 테스트
print_info "데이터베이스 연결 테스트..."
if docker-compose -p "${PROJECT_NAME}" ${COMPOSE_FILES} exec -T mysql mysql -u "${DB_USERNAME}" -p"${DB_PASSWORD}" -e "USE ${DB_NAME}; SELECT 'DB Connection OK' as status;" > /dev/null 2>&1; then
    print_success "데이터베이스 연결 정상"
else
    print_error "데이터베이스 연결 실패"
    exit 1
fi

# =====================================
# 운영 모니터링 설정
# =====================================
print_info "운영 모니터링 확인..."

# 컨테이너 리소스 사용량 체크
docker stats --no-stream "${PROJECT_NAME}-api" "${PROJECT_NAME}-web" "${PROJECT_NAME}-mysql" 2>/dev/null | while read line; do
    print_info "리소스: $line"
done

# =====================================
# 배포 후 정리 (운영 환경)
# =====================================
print_info "배포 후 정리 작업 중..."

# 사용하지 않는 이미지 정리 (주의깊게)
docker image prune -f --filter "dangling=true" > /dev/null 2>&1 || true

# 오래된 백업 정리 (운영 환경에서는 더 보수적으로)
find . -name ".deployment-backup-*" -mtime +30 -delete 2>/dev/null || true
find . -name "mysql-backup-*.sql" -mtime +30 -delete 2>/dev/null || true

# =====================================
# 배포 완료 리포트
# =====================================
DOMAIN="${DOMAIN:-kamf.site}"

print_deployment_summary \
    "$ENVIRONMENT" \
    "$PROJECT_NAME" \
    "$DOMAIN" \
    "$DB_NAME" \
    "$API_PORT" \
    "$WEB_PORT"

# 운영 환경 추가 정보
print_info "\n운영 환경 추가 정보:"
print_info "  🔒 MySQL 외부 포트: $MYSQL_PORT"
print_info "  📊 컨테이너 상태: docker-compose -p $PROJECT_NAME ps"
print_info "  📝 로그 확인: docker-compose -p $PROJECT_NAME logs"
print_info "  💾 백업 파일들이 저장되었습니다"

print_success "🎉 KAMF 운영 환경 배포가 성공적으로 완료되었습니다!"
print_info "운영 서버 접속 정보:"
print_info "  🌐 웹사이트: https://${DOMAIN}:${WEB_PORT}"
print_info "  🔗 API: https://${DOMAIN}:${API_PORT}"
print_info "  📚 API 문서: https://${DOMAIN}:${API_PORT}/api"
print_info "  🗄️ MySQL: ${DOMAIN}:${MYSQL_PORT}"
print_warning "운영 서버가 정상적으로 작동하는지 모니터링하고 필요시 대응하세요."

exit 0
