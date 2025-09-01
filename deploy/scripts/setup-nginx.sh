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

# 3. SSL 인증서 복사
log_info "SSL 인증서를 복사합니다..."

# Let's Encrypt 인증서 확인 및 복사
if [[ -d "/etc/letsencrypt/live" ]]; then
    # 운영환경 인증서 (kamf.site)
    if [[ -d "/etc/letsencrypt/live/kamf.site" ]]; then
        log_info "운영환경 SSL 인증서를 복사합니다..."
        sudo cp /etc/letsencrypt/live/kamf.site/fullchain.pem nginx/ssl/kamf.site.crt
        sudo cp /etc/letsencrypt/live/kamf.site/privkey.pem nginx/ssl/kamf.site.key
        sudo chown $(whoami):$(whoami) nginx/ssl/kamf.site.*
        log_success "운영환경 SSL 인증서 복사 완료"
    else
        log_warning "운영환경 SSL 인증서를 찾을 수 없습니다: /etc/letsencrypt/live/kamf.site"
    fi
    
    # 개발환경 인증서 (dev.kamf.site)
    if [[ -d "/etc/letsencrypt/live/dev.kamf.site" ]]; then
        log_info "개발환경 SSL 인증서를 복사합니다..."
        sudo cp /etc/letsencrypt/live/dev.kamf.site/fullchain.pem nginx/ssl/dev.kamf.site.crt
        sudo cp /etc/letsencrypt/live/dev.kamf.site/privkey.pem nginx/ssl/dev.kamf.site.key
        sudo chown $(whoami):$(whoami) nginx/ssl/dev.kamf.site.*
        log_success "개발환경 SSL 인증서 복사 완료"
    else
        log_warning "개발환경 SSL 인증서를 찾을 수 없습니다: /etc/letsencrypt/live/dev.kamf.site"
    fi
else
    log_error "Let's Encrypt 인증서 디렉터리를 찾을 수 없습니다: /etc/letsencrypt/live"
    log_info "수동으로 SSL 인증서를 nginx/ssl/ 디렉터리에 복사해야 합니다."
    log_info "필요한 파일들:"
    log_info "  - nginx/ssl/kamf.site.crt"
    log_info "  - nginx/ssl/kamf.site.key"
    log_info "  - nginx/ssl/dev.kamf.site.crt"
    log_info "  - nginx/ssl/dev.kamf.site.key"
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

# 5. 설정 완료 메시지
echo ""
log_success "Docker Nginx 설정 초기화가 완료되었습니다!"
echo ""
log_info "다음 단계:"
log_info "1. nginx 설정 파일들을 검토하세요:"
for file in "${config_files[@]}"; do
    echo "   - $file"
done
echo ""
log_info "2. SSL 인증서가 올바르게 복사되었는지 확인하세요:"
echo "   ls -la nginx/ssl/"
echo ""
log_info "3. Docker Nginx로 전환하려면 다음 스크립트를 실행하세요:"
echo "   ./scripts/migrate-to-docker-nginx.sh"
echo ""
