#!/bin/bash
#
# KAMF 공통 배포 함수들
# 모든 환경별 배포 스크립트에서 공통으로 사용되는 함수들을 정의
#
set -e

# =====================================
# 색상 출력 함수들
# =====================================
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

print_header() {
    echo -e "\033[1;35m================================\033[0m"
    echo -e "\033[1;35m $1\033[0m"
    echo -e "\033[1;35m================================\033[0m"
}

# =====================================
# 환경변수 검증 함수들
# =====================================
check_required_vars() {
    local required_vars=("$@")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "필수 환경변수가 설정되지 않았습니다:"
        for var in "${missing_vars[@]}"; do
            print_error "  - $var"
        done
        exit 1
    fi
}

load_env_file() {
    local env_file="${1:-.env.deploy}"
    
    if [ -f "$env_file" ]; then
        print_info "환경변수 파일 로드: $env_file"
        export $(cat "$env_file" | grep -v '^#' | xargs)
        return 0
    elif [ -f "../$env_file" ]; then
        print_info "환경변수 파일 로드: ../$env_file"  
        export $(cat "../$env_file" | grep -v '^#' | xargs)
        return 0
    else
        print_error "환경변수 파일을 찾을 수 없습니다: $env_file"
        print_info "현재 디렉토리: $(pwd)"
        return 1
    fi
}

# =====================================
# Docker MySQL 관련 함수들  
# =====================================
wait_for_docker_mysql() {
    local compose_files="$1"
    local project_name="$2"
    local max_attempts=60
    local attempt=0
    
    print_info "Docker MySQL 준비 대기 중..."
    
    while [ $attempt -lt $max_attempts ]; do
        # MySQL 컨테이너가 실행 중인지 확인
        if docker-compose -p "${project_name}" ${compose_files} exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
            print_success "Docker MySQL이 준비되었습니다"
            return 0
        fi
        
        sleep 2
        attempt=$((attempt + 1))
        
        if [ $((attempt % 15)) -eq 0 ]; then
            print_info "MySQL 대기 중... (${attempt}/${max_attempts})"
        fi
    done
    
    print_error "Docker MySQL 준비 시간 초과 (${max_attempts}초)"
    return 1
}

ensure_docker_mysql() {
    local compose_files="$1"
    local project_name="$2"
    local mysql_port="$3"
    
    print_info "Docker MySQL 상태 확인 중 (포트: ${mysql_port})..."
    
    # 1. MySQL 컨테이너가 실행 중인지 확인
    if docker ps --format "{{.Names}}" | grep -q "^${project_name}-mysql$"; then
        print_info "MySQL 컨테이너가 실행 중입니다. 연결 상태 확인..."
        
        # 2. MySQL 서비스 응답 확인
        if docker-compose -p "${project_name}" ${compose_files} exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
            print_success "Docker MySQL이 이미 정상 작동 중입니다. 재시작 건너뜀"
            return 0
        else
            print_warning "MySQL 컨테이너는 실행 중이지만 응답하지 않습니다. 재시작 필요"
        fi
    else
        print_info "MySQL 컨테이너가 중지되어 있습니다. 시작 필요"
    fi
    
    # 3. MySQL 컨테이너 시작/재시작
    print_info "Docker MySQL 컨테이너 시작 중..."
    if ! docker-compose -p "${project_name}" ${compose_files} up -d mysql 2>/dev/null; then
        print_warning "docker-compose로 MySQL 시작 실패. 직접 복구 시도..."
        
        # 4. ContainerConfig 에러 등으로 실패 시 대체 방안
        print_info "손상된 MySQL 컨테이너 정리 후 재생성..."
        docker stop "${project_name}-mysql" 2>/dev/null || true
        docker rm "${project_name}-mysql" 2>/dev/null || true
        
        # 5. 직접 MySQL 컨테이너 실행 (docker-compose 우회)
        if ! docker-compose -p "${project_name}" ${compose_files} up -d mysql; then
            print_error "MySQL 복구 실패. 수동 점검 필요"
            return 1
        fi
    fi
    
    # 6. MySQL 준비 대기
    if wait_for_docker_mysql "$compose_files" "$project_name"; then
        print_success "Docker MySQL이 정상적으로 시작되었습니다"
        return 0
    else
        print_error "Docker MySQL 시작에 실패했습니다"
        return 1
    fi
}

# DB 연결 검증 및 환경변수 확인
validate_db_connection() {
    local project_name="$1"
    local compose_files="$2"
    local max_attempts="${3:-5}"
    
    print_info "DB 연결 및 환경변수 검증 중..."
    
    # 1. API 컨테이너의 DB 환경변수 확인
    if docker ps --format "{{.Names}}" | grep -q "^${project_name}-api$"; then
        local api_db_password=$(docker inspect "${project_name}-api" --format '{{json .Config.Env}}' | jq -r '.[]' | grep 'DB_PASSWORD' | cut -d'=' -f2)
        print_info "API DB_PASSWORD: ${api_db_password}"
    fi
    
    # 2. MySQL 컨테이너의 환경변수 확인  
    if docker ps --format "{{.Names}}" | grep -q "${project_name}-mysql"; then
        local mysql_password=$(docker inspect "${project_name}-mysql" --format '{{json .Config.Env}}' | jq -r '.[]' | grep 'MYSQL_PASSWORD' | cut -d'=' -f2)
        print_info "MySQL MYSQL_PASSWORD: ${mysql_password}"
    fi
    
    # 3. 실제 DB 연결 테스트
    for i in $(seq 1 $max_attempts); do
        if docker-compose -p "${project_name}" ${compose_files} exec -T mysql mysql -u"${DB_USERNAME:-kamf_user}" -p"${DB_PASSWORD}" -D"${DB_NAME}" -e "SELECT 'Connection Test Success' as status;" >/dev/null 2>&1; then
            print_success "DB 연결 검증 성공 (${i}/${max_attempts})"
            return 0
        fi
        
        if [ $i -lt $max_attempts ]; then
            print_info "DB 연결 재시도... (${i}/${max_attempts})"
            sleep 2
        fi
    done
    
    print_error "DB 연결 검증 실패. 환경변수 불일치 가능성"
    return 1
}

# =====================================
# 컨테이너 헬스체크 함수들
# =====================================
wait_for_container_ready() {
    local project_name="$1"
    local container_name="$2"
    local max_wait="${3:-60}"
    local wait_time=0
    
    print_info "${container_name} 컨테이너 준비 대기..."
    
    while [ $wait_time -lt $max_wait ]; do
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep "${project_name}-${container_name}" | grep -q "Up"; then
            print_success "${container_name} 컨테이너가 실행 중입니다"
            return 0
        fi
        
        sleep 2
        wait_time=$((wait_time + 2))
        
        if [ $((wait_time % 10)) -eq 0 ]; then
            print_info "${container_name} 대기 중... (${wait_time}s/${max_wait}s)"
        fi
    done
    
    print_error "${container_name} 컨테이너가 ${max_wait}초 내에 준비되지 않았습니다"
    return 1
}

check_application_health() {
    local project_name="$1"
    local api_port="$2"
    local web_port="$3"
    local max_attempts="${4:-15}"
    
    print_info "애플리케이션 헬스체크 수행 중..."
    
    # API 헬스체크
    local api_attempts=0
    while [ $api_attempts -lt $max_attempts ]; do
        if docker-compose -p "${project_name}" exec -T api curl -f http://localhost:8000/health > /dev/null 2>&1; then
            print_success "API 헬스체크 통과"
            break
        fi
        
        api_attempts=$((api_attempts + 1))
        if [ $api_attempts -lt $max_attempts ]; then
            sleep 2
        fi
    done
    
    if [ $api_attempts -ge $max_attempts ]; then
        print_error "API 헬스체크 실패 ($max_attempts 회 시도)"
        return 1
    fi
    
    # Web 헬스체크
    if docker-compose -p "${project_name}" exec -T web wget --spider -q http://localhost:3000/ > /dev/null 2>&1; then
        print_success "Web 애플리케이션 헬스체크 통과"
    else
        print_warning "Web 애플리케이션 내부 헬스체크 실패 (계속 진행)"
    fi
    
    return 0
}

# =====================================
# 외부 접근 테스트 함수들
# =====================================
test_external_access() {
    local api_port="$1"
    local web_port="$2"
    local max_attempts="${3:-5}"
    
    print_info "외부 접근 테스트 실행..."
    
    # API 외부 접근 테스트
    local api_success=0
    local api_attempt=0
    
    while [ $api_attempt -lt $max_attempts ]; do
        if curl -f -m 10 "http://localhost:${api_port}/health" > /dev/null 2>&1; then
            print_success "외부 API 접근 확인 (포트 ${api_port})"
            api_success=1
            break
        fi
        
        api_attempt=$((api_attempt + 1))
        if [ $api_attempt -lt $max_attempts ]; then
            print_info "API 외부 접근 테스트 재시도... (${api_attempt}/${max_attempts})"
            sleep 3
        fi
    done
    
    if [ $api_success -eq 0 ]; then
        print_warning "외부 API 접근 테스트 실패 (포트 바인딩 또는 방화벽 문제일 수 있음)"
    fi
    
    # Web 외부 접근 테스트
    local web_success=0
    local web_attempt=0
    
    while [ $web_attempt -lt $max_attempts ]; do
        if curl -f -m 10 "http://localhost:${web_port}/" > /dev/null 2>&1; then
            print_success "외부 Web 접근 확인 (포트 ${web_port})"
            web_success=1
            break
        fi
        
        web_attempt=$((web_attempt + 1))
        if [ $web_attempt -lt $max_attempts ]; then
            print_info "Web 외부 접근 테스트 재시도... (${web_attempt}/${max_attempts})"
            sleep 3
        fi
    done
    
    if [ $web_success -eq 0 ]; then
        print_warning "외부 Web 접근 테스트 실패 (포트 바인딩 또는 방화벽 문제일 수 있음)"
    fi
}

# =====================================
# Docker 관리 함수들
# =====================================
docker_cleanup() {
    print_info "Docker 시스템 정리 실행..."
    
    # Dangling 객체 제거
    docker system prune -f > /dev/null 2>&1 || true
    
    # 오래된 볼륨 정리 (선택적)
    docker volume prune -f > /dev/null 2>&1 || true
    
    print_success "Docker 정리 완료"
}

# ContainerConfig 에러 등 손상된 컨테이너 복구 (매우 안전한 프로젝트별 정리)
force_container_recovery() {
    local project_name="$1"
    local compose_files="$2"
    
    print_warning "손상된 컨테이너 강제 복구 시작 (프로젝트: ${project_name})"
    
    # 1. 애플리케이션 서비스만 안전하게 중지 (MySQL은 보호)
    print_info "애플리케이션 서비스만 안전하게 중지 중 (MySQL 보호)..."
    docker-compose -p "${project_name}" ${compose_files} stop web api || true
    docker-compose -p "${project_name}" ${compose_files} rm -f web api || true
    
    # 2. 애플리케이션 서비스만 개별 제거 (MySQL은 데이터 보호를 위해 제외)
    print_info "애플리케이션 컨테이너만 정확히 제거 중 (MySQL 보호)..."
    for service in web api; do
        local container_name="${project_name}-${service}"
        if docker ps -a --format "{{.Names}}" | grep -q "^${container_name}$"; then
            print_info "  - ${container_name} 제거"
            docker rm -f "${container_name}" || true
        fi
    done
    
    # MySQL은 데이터 손실 방지를 위해 강제 제거하지 않음
    print_info "MySQL 컨테이너는 데이터 보호를 위해 보존됨"
    
    # 3. 프로젝트 전용 네트워크만 정리 (정확한 매칭)
    print_info "프로젝트 네트워크 정리 중..."
    if docker network ls --format "{{.Name}}" | grep -q "^${project_name}-network$"; then
        docker network rm "${project_name}-network" || true
    fi
    
    # 4. 매우 안전한 정리: dangling 컨테이너만 (이미지는 건드리지 않음)
    print_info "중지된 컨테이너만 안전 정리 중..."
    docker container prune -f > /dev/null 2>&1 || true
    
    print_success "매우 안전한 프로젝트별 컨테이너 복구 완료"
}

backup_container_state() {
    local project_name="$1"
    local backup_file=".deployment-backup-$(date +%Y%m%d_%H%M%S)"
    
    print_info "컨테이너 상태 백업 중..."
    
    if docker-compose -p "${project_name}" ps > "$backup_file" 2>/dev/null; then
        print_success "컨테이너 상태 백업 완료: $backup_file"
        return 0
    else
        print_warning "컨테이너 상태 백업 실패 (계속 진행)"
        return 1
    fi
}

cleanup_old_backups() {
    print_info "오래된 백업 파일 정리 중..."
    
    # 7일 이상 된 백업 파일 제거
    find . -name ".deployment-backup-*" -mtime +7 -delete 2>/dev/null || true
    
    print_success "백업 파일 정리 완료"
}

# =====================================
# 배포 완료 리포트 함수
# =====================================
print_deployment_summary() {
    local environment="$1"
    local deploy_path="$2"
    local domain="$3"
    local db_name="$4"
    local api_port="$5"
    local web_port="$6"
    
    print_header "배포 완료 요약"
    print_info "환경: $environment"
    print_info "배포 경로: $deploy_path"
    print_info "도메인: $domain"
    print_info "데이터베이스: $db_name"
    print_info "API 포트: $api_port"
    print_info "Web 포트: $web_port"
    print_info "Docker Registry: ${DOCKER_REGISTRY:-N/A}"
    print_info "이미지 태그: ${IMAGE_TAG:-N/A}"
    print_info "배포자: ${DEPLOYED_BY:-Unknown}"
    print_info "커밋 SHA: ${COMMIT_SHA:-Unknown}"
    print_info "배포 시간: ${DEPLOYMENT_TIME:-$(date '+%Y-%m-%d %H:%M:%S')}"
    
    print_info "\n현재 실행 중인 컨테이너 상태:"
    docker-compose -p "$deploy_path" ps 2>/dev/null || echo "컨테이너 상태를 가져올 수 없습니다"
}
