#!/bin/bash
# renew-ssl.sh - Docker certbot으로 SSL 인증서 갱신

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
if [[ ! -f "docker-compose-nginx.yml" ]]; then
    log_error "docker-compose-nginx.yml이 없습니다. deploy 디렉터리에서 실행하세요."
    exit 1
fi

log_info "Docker certbot으로 SSL 인증서 갱신을 시작합니다..."

# nginx가 실행 중인지 확인
if ! docker ps | grep -q kamf-nginx; then
    log_error "nginx 컨테이너가 실행되지 않고 있습니다."
    log_info "먼저 nginx를 시작하세요: docker-compose -f docker-compose-nginx.yml up -d"
    exit 1
fi

log_success "nginx 컨테이너가 실행 중입니다."

# 인증서 갱신 전 상태 확인
log_info "현재 인증서 상태를 확인합니다..."
docker run --rm -v kamf-letsencrypt-data:/etc/letsencrypt certbot/certbot certificates || true

# 인증서 갱신 (webroot 모드)
log_info "SSL 인증서 갱신을 수행합니다..."
if docker-compose -f docker-compose-nginx.yml run --rm certbot-renew; then
    log_success "SSL 인증서 갱신 명령 실행 완료"
else
    log_warning "SSL 인증서 갱신에 실패했거나 갱신이 불필요합니다."
    log_info "Let's Encrypt는 만료 30일 전부터 갱신이 가능합니다."
fi

# nginx 설정 리로드 (인증서가 갱신된 경우)
log_info "nginx 설정을 리로드합니다..."
if docker exec kamf-nginx nginx -s reload; then
    log_success "nginx 설정 리로드 완료"
else
    log_error "nginx 설정 리로드에 실패했습니다."
    
    # nginx 설정 테스트
    log_info "nginx 설정을 테스트합니다..."
    docker exec kamf-nginx nginx -t || true
fi

# 갱신 후 상태 확인
log_info "갱신 후 인증서 상태를 확인합니다..."
docker run --rm -v kamf-letsencrypt-data:/etc/letsencrypt certbot/certbot certificates | grep -E "(Certificate Name:|Expiry Date:)" || true

# SSL 연결 테스트
log_info "SSL 연결을 테스트합니다..."
domains=("kamf.site" "dev.kamf.site")
for domain in "${domains[@]}"; do
    log_info "테스트 중: https://$domain"
    if timeout 10 curl -sI "https://$domain" > /dev/null 2>&1; then
        log_success "$domain SSL 연결 정상"
    else
        log_warning "$domain SSL 연결 실패"
    fi
done

# 갱신 로그 확인
log_info "최근 갱신 로그를 확인합니다..."
docker run --rm -v kamf-letsencrypt-data:/etc/letsencrypt alpine tail -20 /etc/letsencrypt/letsencrypt.log 2>/dev/null || log_info "갱신 로그를 찾을 수 없습니다."

echo ""
log_success "🔄 SSL 인증서 갱신 작업이 완료되었습니다!"
echo ""
log_info "📋 갱신 정보:"
log_info "- 갱신은 만료 30일 전부터 가능합니다"
log_info "- 자동 갱신은 cron으로 설정되어야 합니다"
log_info "- 다음 갱신 확인: ./scripts/renew-ssl.sh"
echo ""
