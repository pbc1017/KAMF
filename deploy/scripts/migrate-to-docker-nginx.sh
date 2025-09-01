#!/bin/bash
# migrate-to-docker-nginx.sh - 호스트 nginx에서 Docker nginx로 전환

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 종료 시 정리 함수
cleanup_on_exit() {
    if [[ $? -ne 0 ]]; then
        log_error "스크립트 실행 중 오류가 발생했습니다. 롤백을 실행합니다."
        ./scripts/rollback-to-host-nginx.sh
    fi
}

trap cleanup_on_exit EXIT

# 현재 디렉터리 확인
if [[ ! -f "docker-compose.yml" ]]; then
    log_error "docker-compose.yml이 없습니다. deploy 디렉터리에서 실행하세요."
    exit 1
fi

log_info "호스트 nginx에서 Docker nginx로 전환을 시작합니다..."

# 1. 사전 검사
log_info "사전 검사를 수행합니다..."

# Docker 및 Docker Compose 확인
if ! command -v docker &> /dev/null; then
    log_error "Docker가 설치되어 있지 않습니다."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose가 설치되어 있지 않습니다."
    exit 1
fi

# nginx 설정 파일 존재 확인
config_files=(
    "nginx/conf.d/default.conf"
    "nginx/conf.d/kamf-common.conf"
    "nginx/conf.d/kamf-prod.conf"
    "nginx/conf.d/kamf-dev.conf"
)

for file in "${config_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        log_error "nginx 설정 파일이 없습니다: $file"
        log_info "먼저 ./scripts/setup-nginx.sh를 실행하세요."
        exit 1
    fi
done

# SSL 인증서 확인
ssl_files=(
    "nginx/ssl/kamf.site.crt"
    "nginx/ssl/kamf.site.key"
    "nginx/ssl/dev.kamf.site.crt"
    "nginx/ssl/dev.kamf.site.key"
)

missing_ssl=()
for file in "${ssl_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        missing_ssl+=("$file")
    fi
done

if [[ ${#missing_ssl[@]} -gt 0 ]]; then
    log_warning "다음 SSL 인증서들이 없습니다:"
    for file in "${missing_ssl[@]}"; do
        echo "  - $file"
    done
    log_info "먼저 ./scripts/setup-nginx.sh를 실행하거나 수동으로 복사하세요."
    exit 1
fi

log_success "사전 검사 완료"

# 2. nginx 설정 문법 검사
log_info "Docker nginx 설정 문법을 검사합니다..."

# 임시로 nginx 컨테이너를 실행하여 설정 검사
docker run --rm \
    -v "$(pwd)/nginx/conf.d:/etc/nginx/conf.d:ro" \
    -v "$(pwd)/nginx/ssl:/etc/ssl/certs:ro" \
    nginx:alpine nginx -t

if [[ $? -ne 0 ]]; then
    log_error "nginx 설정에 문법 오류가 있습니다."
    exit 1
fi

log_success "nginx 설정 문법 검사 통과"

# 3. 기존 호스트 nginx 상태 백업
log_info "기존 호스트 nginx 상태를 백업합니다..."

# nginx 상태 확인
if systemctl is-active --quiet nginx; then
    echo "active" > nginx/backup-nginx-status
    log_info "현재 nginx가 실행 중입니다."
else
    echo "inactive" > nginx/backup-nginx-status
    log_info "현재 nginx가 중지되어 있습니다."
fi

# 포트 사용 상태 백업
netstat -tlnp 2>/dev/null | grep ":80 \|:443 " > nginx/backup-port-status || true

log_success "호스트 nginx 상태 백업 완료"

# 4. 기존 서비스들 상태 확인
log_info "기존 Docker 서비스들의 상태를 확인합니다..."

# 실행 중인 컨테이너 확인
running_containers=$(docker ps --format "table {{.Names}}" | grep -E "(kamf|mysql)" | grep -v NAMES || true)

if [[ -n "$running_containers" ]]; then
    log_info "실행 중인 kamf 관련 컨테이너들:"
    echo "$running_containers"
else
    log_warning "실행 중인 kamf 관련 컨테이너가 없습니다."
fi

# 5. 호스트 nginx 중지
log_info "호스트 nginx를 중지합니다..."

if systemctl is-active --quiet nginx; then
    sudo systemctl stop nginx
    log_success "호스트 nginx 중지 완료"
    
    # 잠시 대기 (포트 해제 대기)
    sleep 3
    
    # 포트 해제 확인
    if netstat -tlnp 2>/dev/null | grep -q ":80 \|:443 "; then
        log_warning "아직 80/443 포트가 사용 중입니다. 5초 더 대기..."
        sleep 5
    fi
else
    log_info "호스트 nginx가 이미 중지되어 있습니다."
fi

# 6. Docker nginx 시작
log_info "Docker nginx를 시작합니다..."

# .env 파일 로드 (있는 경우)
if [[ -f ".env" ]]; then
    export $(grep -v '^#' .env | xargs)
fi

# 환경별 네트워크가 존재하는지 확인하고 생성
log_info "필요한 Docker 네트워크를 확인합니다..."

# dev 환경 네트워크 생성 (없는 경우에만)
if ! docker network ls | grep -q "kamf-dev-network"; then
    log_info "개발환경 네트워크를 생성합니다..."
    docker network create kamf-dev-network || true
fi

# prod 환경 네트워크 생성 (없는 경우에만) 
if ! docker network ls | grep -q "kamf-prod-network"; then
    log_info "운영환경 네트워크를 생성합니다..."
    docker network create kamf-prod-network || true
fi

# Docker Compose로 nginx 전용 파일 사용
log_info "Docker nginx 전용 compose 파일로 nginx를 시작합니다..."
docker-compose -f docker-compose-nginx.yml up -d

if [[ $? -ne 0 ]]; then
    log_error "Docker nginx 시작에 실패했습니다."
    exit 1
fi

log_success "Docker nginx 시작 완료"

# 7. 헬스체크 대기
log_info "nginx 헬스체크를 수행합니다..."

# nginx 컨테이너가 시작될 때까지 대기
for i in {1..30}; do
    if docker ps | grep -q "kamf-nginx"; then
        break
    fi
    log_info "nginx 컨테이너 시작 대기 중... (${i}/30)"
    sleep 2
done

# nginx 설정 테스트
docker exec kamf-nginx nginx -t

if [[ $? -ne 0 ]]; then
    log_error "Docker nginx 설정 테스트에 실패했습니다."
    exit 1
fi

log_success "nginx 헬스체크 통과"

# 8. 서비스 접근 테스트
log_info "서비스 접근성을 테스트합니다..."

# HTTP 리다이렉트 테스트
test_urls=(
    "http://kamf.site"
    "http://dev.kamf.site"
)

for url in "${test_urls[@]}"; do
    log_info "테스트 중: $url"
    
    # curl로 HTTP 상태 코드 확인 (301 리다이렉트 예상)
    status_code=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 10 "$url" || echo "000")
    
    if [[ "$status_code" == "301" ]] || [[ "$status_code" == "200" ]]; then
        log_success "$url 접근 성공 (HTTP $status_code)"
    else
        log_warning "$url 접근 실패 (HTTP $status_code)"
    fi
done

# 9. Docker logs 확인
log_info "nginx 로그를 확인합니다..."
echo "=== nginx 로그 (최근 10줄) ==="
docker logs --tail 10 kamf-nginx || true
echo "========================="

# 10. 완료 메시지
echo ""
log_success "🎉 Docker nginx로 전환이 완료되었습니다!"
echo ""
log_info "📊 상태 확인:"
echo "  - Docker nginx 컨테이너: $(docker ps -q -f name=kamf-nginx | wc -l)개 실행 중"
echo "  - 포트 80/443: Docker nginx가 처리"
echo "  - 호스트 nginx: 중지됨"
echo ""
log_info "📋 유용한 명령어들:"
echo "  - nginx 로그 확인: docker logs -f kamf-nginx"
echo "  - nginx 설정 테스트: docker exec kamf-nginx nginx -t"
echo "  - nginx 재로드: docker exec kamf-nginx nginx -s reload"
echo "  - 롤백: ./scripts/rollback-to-host-nginx.sh"
echo ""
log_info "🌐 서비스 URL들:"
echo "  - 운영환경: https://kamf.site"
echo "  - 개발환경: https://dev.kamf.site"
echo ""

# 성공 시 trap 해제
trap - EXIT
