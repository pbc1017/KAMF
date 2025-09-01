#!/bin/bash
# issue-ssl.sh - Docker certbot으로 SSL 인증서 최초 발급

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

log_info "Docker certbot으로 SSL 인증서 발급을 시작합니다..."

# 환경변수 확인
if [[ -z "$CERTBOT_EMAIL" ]]; then
    log_error "CERTBOT_EMAIL 환경변수가 설정되지 않았습니다."
    log_info "예: export CERTBOT_EMAIL=\"your-email@example.com\""
    exit 1
fi

if [[ -z "$DOMAIN" ]]; then
    log_error "DOMAIN 환경변수가 설정되지 않았습니다."
    log_info "예: export DOMAIN=\"kamf.site\""
    exit 1
fi

log_info "도메인: $DOMAIN, dev.$DOMAIN"
log_info "이메일: $CERTBOT_EMAIL"

# nginx 중지 (standalone 모드 사용을 위해)
log_info "nginx 컨테이너를 중지합니다..."
if docker ps | grep -q kamf-nginx; then
    docker stop kamf-nginx || true
    log_success "nginx 컨테이너 중지 완료"
else
    log_info "nginx 컨테이너가 실행 중이지 않습니다."
fi

# Docker 볼륨 생성 (없는 경우)
log_info "필요한 Docker 볼륨을 확인합니다..."
if ! docker volume ls | grep -q kamf-letsencrypt-data; then
    docker volume create kamf-letsencrypt-data
    log_success "letsencrypt 볼륨 생성 완료"
fi

if ! docker volume ls | grep -q kamf-webroot-data; then
    docker volume create kamf-webroot-data  
    log_success "webroot 볼륨 생성 완료"
fi

# certbot으로 인증서 발급
log_info "SSL 인증서를 발급합니다..."
if docker-compose -f docker-compose-nginx.yml run --rm certbot; then
    log_success "SSL 인증서 발급 완료!"
else
    log_error "SSL 인증서 발급에 실패했습니다."
    exit 1
fi

# 인증서 확인
log_info "발급된 인증서를 확인합니다..."
if docker run --rm -v kamf-letsencrypt-data:/etc/letsencrypt alpine ls -la /etc/letsencrypt/live/ | grep -E "(kamf\.site|dev\.kamf\.site)"; then
    log_success "인증서가 성공적으로 생성되었습니다."
else
    log_warning "인증서 확인에 실패했습니다."
fi

# nginx 재시작
log_info "nginx 컨테이너를 재시작합니다..."
if docker-compose -f docker-compose-nginx.yml up -d; then
    log_success "nginx 재시작 완료"
    
    # nginx 설정 테스트
    sleep 5
    if docker exec kamf-nginx nginx -t; then
        log_success "nginx 설정 검증 통과"
    else
        log_error "nginx 설정에 오류가 있습니다."
    fi
else
    log_error "nginx 재시작에 실패했습니다."
fi

# 최종 테스트
log_info "SSL 인증서 테스트를 수행합니다..."
for domain in "$DOMAIN" "dev.$DOMAIN"; do
    log_info "테스트 중: https://$domain"
    if timeout 10 curl -sI "https://$domain" > /dev/null 2>&1; then
        log_success "$domain SSL 연결 성공"
    else
        log_warning "$domain SSL 연결 실패 (서비스가 실행되지 않았을 수 있음)"
    fi
done

echo ""
log_success "🎉 SSL 인증서 발급이 완료되었습니다!"
echo ""
log_info "📋 다음 단계:"
log_info "1. 정기 갱신을 위해 cron 설정: ./scripts/setup-ssl-cron.sh"
log_info "2. 수동 갱신: ./scripts/renew-ssl.sh"
log_info "3. 인증서 확인: docker run --rm -v kamf-letsencrypt-data:/etc/letsencrypt alpine ls -la /etc/letsencrypt/live/"
echo ""
