#!/bin/bash
# setup-nginx.sh - Docker Nginx를 위한 초기 설정

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

# 현재 디렉터리 확인
if [[ ! -f "docker-compose.yml" ]]; then
    log_error "docker-compose.yml이 없습니다. deploy 디렉터리에서 실행하세요."
    exit 1
fi

log_info "Docker Nginx 설정 초기화를 시작합니다..."

# 1. nginx 디렉터리 구조 생성
log_info "nginx 디렉터리 구조를 생성합니다..."
mkdir -p nginx/ssl
mkdir -p nginx/conf.d

log_success "디렉터리 구조 생성 완료"

# 2. 기존 호스트 nginx 설정 백업 (참고용)
if [[ -d "/etc/nginx" ]]; then
    log_info "기존 호스트 nginx 설정을 백업합니다..."
    
    if [[ ! -d "nginx/backup-host-nginx" ]]; then
        mkdir -p nginx/backup-host-nginx
        
        # nginx.conf 백업
        if [[ -f "/etc/nginx/nginx.conf" ]]; then
            sudo cp /etc/nginx/nginx.conf nginx/backup-host-nginx/
        fi
        
        # sites-available 백업
        if [[ -d "/etc/nginx/sites-available" ]]; then
            sudo cp -r /etc/nginx/sites-available nginx/backup-host-nginx/
        fi
        
        # sites-enabled 백업
        if [[ -d "/etc/nginx/sites-enabled" ]]; then
            sudo cp -r /etc/nginx/sites-enabled nginx/backup-host-nginx/
        fi
        
        # 백업 파일 권한 수정
        sudo chown -R $(whoami):$(whoami) nginx/backup-host-nginx/
        
        log_success "호스트 nginx 설정 백업 완료"
    else
        log_info "nginx 백업이 이미 존재합니다. 스킵..."
    fi
else
    log_warning "호스트에 nginx가 설치되어 있지 않습니다."
fi

# 3. Docker 볼륨 생성 (SSL 인증서용)
log_info "Docker 볼륨을 생성합니다..."

# SSL 인증서용 볼륨 생성
if ! docker volume ls | grep -q kamf-letsencrypt-data; then
    docker volume create kamf-letsencrypt-data
    log_success "letsencrypt 볼륨 생성 완료"
else
    log_info "letsencrypt 볼륨이 이미 존재합니다."
fi

# webroot 볼륨 생성
if ! docker volume ls | grep -q kamf-webroot-data; then
    docker volume create kamf-webroot-data
    log_success "webroot 볼륨 생성 완료"
else
    log_info "webroot 볼륨이 이미 존재합니다."
fi

# SSL 인증서 상태 확인
log_info "SSL 인증서 상태를 확인합니다..."
if docker run --rm -v kamf-letsencrypt-data:/etc/letsencrypt alpine ls /etc/letsencrypt/live/ 2>/dev/null | grep -E "(kamf\.site|dev\.kamf\.site)"; then
    log_success "SSL 인증서가 이미 존재합니다."
else
    log_warning "SSL 인증서가 없습니다. 다음 명령어로 발급하세요:"
    log_info "  export CERTBOT_EMAIL=\"your-email@example.com\""
    log_info "  export DOMAIN=\"kamf.site\""
    log_info "  ./scripts/issue-ssl.sh"
fi

# 4. nginx 설정 파일 확인
log_info "nginx 설정 파일을 확인합니다..."

config_files=(
    "nginx/conf.d/default.conf"
    "nginx/conf.d/kamf-common.conf"
    "nginx/conf.d/kamf-prod.conf"
    "nginx/conf.d/kamf-dev.conf"
)

missing_files=()
for file in "${config_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        missing_files+=("$file")
    fi
done

if [[ ${#missing_files[@]} -gt 0 ]]; then
    log_error "다음 nginx 설정 파일들이 없습니다:"
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
    log_info "Git에서 최신 코드를 받아오세요: git pull"
    exit 1
fi

log_success "모든 nginx 설정 파일이 존재합니다."

# 4. nginx 설정 파일들 확인 (번호 변경됨)

# 5. 설정 완료 메시지
echo ""
log_success "Docker Nginx 설정 초기화가 완료되었습니다!"
echo ""
log_info "📋 다음 단계:"
log_info "1. nginx 설정 파일들을 검토하세요:"
for file in "${config_files[@]}"; do
    echo "   - $file"
done
echo ""
log_info "2. SSL 인증서 발급 (필요한 경우):"
echo "   export CERTBOT_EMAIL=\"your-email@example.com\""
echo "   export DOMAIN=\"kamf.site\""
echo "   ./scripts/issue-ssl.sh"
echo ""
log_info "3. Docker Nginx로 전환:"
echo "   ./scripts/migrate-to-docker-nginx.sh"
echo ""
log_info "4. SSL 인증서 자동 갱신 설정 (선택사항):"
echo "   ./scripts/setup-ssl-cron.sh"
echo ""
