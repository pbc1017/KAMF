#!/bin/bash
# rollback-to-host-nginx.sh - Docker nginx에서 호스트 nginx로 롤백

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

log_info "Docker nginx에서 호스트 nginx로 롤백을 시작합니다..."

# 1. 현재 상태 확인
log_info "현재 서비스 상태를 확인합니다..."

# Docker nginx 상태 확인
nginx_container=$(docker ps -q -f name=nginx || true)
if [[ -n "$nginx_container" ]]; then
    log_info "Docker nginx 컨테이너 발견: $nginx_container"
else
    log_warning "실행 중인 Docker nginx 컨테이너가 없습니다."
fi

# 호스트 nginx 상태 확인
if systemctl is-active --quiet nginx; then
    log_warning "호스트 nginx가 이미 실행 중입니다."
    host_nginx_running=true
else
    log_info "호스트 nginx가 중지되어 있습니다."
    host_nginx_running=false
fi

# 2. Docker nginx 관련 서비스 중지
if [[ -n "$nginx_container" ]]; then
    log_info "Docker nginx 서비스를 중지합니다..."
    
    # docker-compose로 nginx 서비스만 중지
    docker-compose stop nginx
    
    log_success "Docker nginx 중지 완료"
    
    # 잠시 대기 (포트 해제 대기)
    sleep 3
else
    log_info "중지할 Docker nginx 컨테이너가 없습니다."
fi

# 3. 포트 해제 확인
log_info "포트 해제 상태를 확인합니다..."

if netstat -tlnp 2>/dev/null | grep -q ":80 \|:443 "; then
    log_info "포트 80/443이 아직 사용 중입니다. 상세 정보:"
    netstat -tlnp 2>/dev/null | grep ":80 \|:443 " || true
    
    # 추가 대기
    log_info "포트 해제를 위해 5초 더 대기합니다..."
    sleep 5
else
    log_success "포트 80/443이 해제되었습니다."
fi

# 4. 호스트 nginx 시작
if [[ "$host_nginx_running" == false ]]; then
    log_info "호스트 nginx를 시작합니다..."
    
    # nginx 설정 문법 검사
    if sudo nginx -t; then
        log_success "호스트 nginx 설정 문법 검사 통과"
    else
        log_error "호스트 nginx 설정에 문법 오류가 있습니다."
        log_info "nginx 설정을 확인한 후 수동으로 시작하세요: sudo systemctl start nginx"
        exit 1
    fi
    
    # nginx 시작
    sudo systemctl start nginx
    
    if systemctl is-active --quiet nginx; then
        log_success "호스트 nginx 시작 완료"
    else
        log_error "호스트 nginx 시작에 실패했습니다."
        log_info "로그 확인: sudo journalctl -u nginx -n 20"
        exit 1
    fi
else
    log_info "호스트 nginx가 이미 실행 중입니다."
fi

# 5. nginx 상태 확인
log_info "호스트 nginx 상태를 확인합니다..."

if systemctl is-active --quiet nginx; then
    log_success "호스트 nginx가 정상적으로 실행 중입니다."
    
    # nginx 프로세스 정보
    nginx_processes=$(ps aux | grep nginx | grep -v grep | wc -l)
    log_info "nginx 프로세스: $nginx_processes개 실행 중"
    
else
    log_error "호스트 nginx가 실행되지 않고 있습니다."
    exit 1
fi

# 6. 포트 바인딩 확인
log_info "포트 바인딩을 확인합니다..."

port_80_status=$(netstat -tlnp 2>/dev/null | grep ":80 " || echo "미사용")
port_443_status=$(netstat -tlnp 2>/dev/null | grep ":443 " || echo "미사용")

echo "포트 80: $port_80_status"
echo "포트 443: $port_443_status"

# 7. 서비스 접근 테스트 (선택사항)
if command -v curl &> /dev/null; then
    log_info "서비스 접근성을 테스트합니다..."
    
    test_urls=(
        "http://localhost"
        "http://kamf.site"
        "http://dev.kamf.site"
    )
    
    for url in "${test_urls[@]}"; do
        log_info "테스트 중: $url"
        
        # curl로 HTTP 상태 코드 확인
        status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
        
        if [[ "$status_code" =~ ^[23][0-9][0-9]$ ]]; then
            log_success "$url 접근 성공 (HTTP $status_code)"
        else
            log_warning "$url 접근 실패 (HTTP $status_code)"
        fi
    done
else
    log_warning "curl이 설치되어 있지 않아 접근성 테스트를 스킵합니다."
fi

# 8. Docker 컨테이너 정리 (선택사항)
log_info "Docker nginx 컨테이너 정리를 수행하시겠습니까? [y/N]"
read -r cleanup_response

if [[ "$cleanup_response" =~ ^[Yy]$ ]]; then
    log_info "Docker nginx 컨테이너를 정리합니다..."
    
    # 중지된 nginx 컨테이너 제거
    stopped_nginx=$(docker ps -aq -f name=nginx -f status=exited || true)
    if [[ -n "$stopped_nginx" ]]; then
        docker rm $stopped_nginx
        log_success "중지된 nginx 컨테이너 제거 완료"
    else
        log_info "제거할 중지된 nginx 컨테이너가 없습니다."
    fi
    
    # nginx 이미지 제거 여부 확인
    log_info "nginx 이미지도 제거하시겠습니까? [y/N]"
    read -r remove_image_response
    
    if [[ "$remove_image_response" =~ ^[Yy]$ ]]; then
        docker rmi nginx:alpine 2>/dev/null || log_warning "nginx:alpine 이미지 제거 실패 (사용 중일 수 있음)"
    fi
else
    log_info "Docker 컨테이너 정리를 스킵합니다."
fi

# 9. 백업 파일 정리 안내
if [[ -f "nginx/backup-nginx-status" ]]; then
    log_info "백업 파일들을 정리하시겠습니까? [y/N]"
    read -r cleanup_backup_response
    
    if [[ "$cleanup_backup_response" =~ ^[Yy]$ ]]; then
        rm -f nginx/backup-nginx-status nginx/backup-port-status
        log_success "백업 파일 정리 완료"
    fi
fi

# 10. 완료 메시지
echo ""
log_success "🔄 호스트 nginx로 롤백이 완료되었습니다!"
echo ""
log_info "📊 현재 상태:"
echo "  - 호스트 nginx: $(systemctl is-active nginx)"
echo "  - Docker nginx: 중지됨"
echo "  - 포트 80/443: 호스트 nginx가 처리"
echo ""
log_info "📋 유용한 명령어들:"
echo "  - nginx 상태 확인: sudo systemctl status nginx"
echo "  - nginx 로그 확인: sudo journalctl -u nginx -f"
echo "  - nginx 설정 테스트: sudo nginx -t"
echo "  - nginx 재로드: sudo systemctl reload nginx"
echo ""
log_info "🌐 서비스 URL들:"
echo "  - 운영환경: https://kamf.site"
echo "  - 개발환경: https://dev.kamf.site"
echo ""
