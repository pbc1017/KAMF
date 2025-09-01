#!/bin/bash
# setup-ssl-cron.sh - SSL 인증서 자동 갱신을 위한 cron 설정

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

# 현재 경로 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

if [[ ! -f "$DEPLOY_DIR/docker-compose-nginx.yml" ]]; then
    log_error "docker-compose-nginx.yml을 찾을 수 없습니다."
    exit 1
fi

log_info "SSL 인증서 자동 갱신 cron 설정을 시작합니다..."

# cron 스크립트 생성
CRON_SCRIPT="/usr/local/bin/renew-kamf-ssl.sh"
log_info "cron 스크립트를 생성합니다: $CRON_SCRIPT"

sudo tee "$CRON_SCRIPT" > /dev/null <<EOF
#!/bin/bash
# KAMF SSL 인증서 자동 갱신 스크립트
# 생성일: $(date)

# 로그 설정
LOG_FILE="/var/log/kamf-ssl-renew.log"
exec 1> >(tee -a "\$LOG_FILE")
exec 2>&1

echo "==== SSL 인증서 갱신 시작: \$(date) ===="

# deploy 디렉터리로 이동
cd "$DEPLOY_DIR" || {
    echo "ERROR: deploy 디렉터리로 이동할 수 없습니다: $DEPLOY_DIR"
    exit 1
}

# 갱신 스크립트 실행
if ./scripts/renew-ssl.sh; then
    echo "SUCCESS: SSL 인증서 갱신 완료"
else
    echo "WARNING: SSL 인증서 갱신 실패 또는 불필요"
fi

echo "==== SSL 인증서 갱신 종료: \$(date) ===="
echo ""
EOF

# 스크립트 권한 설정
sudo chmod +x "$CRON_SCRIPT"
log_success "cron 스크립트 생성 완료: $CRON_SCRIPT"

# cron 작업 추가
CRON_JOB="0 2 * * 0 $CRON_SCRIPT"
log_info "cron 작업을 추가합니다..."

# 기존 cron 작업 확인
if crontab -l 2>/dev/null | grep -q "renew-kamf-ssl"; then
    log_warning "기존 KAMF SSL cron 작업이 있습니다."
    log_info "기존 cron 작업:"
    crontab -l | grep "renew-kamf-ssl" || true
    
    echo -n "기존 작업을 교체하시겠습니까? [y/N]: "
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log_info "cron 설정을 취소합니다."
        exit 0
    fi
    
    # 기존 작업 제거
    crontab -l | grep -v "renew-kamf-ssl" | crontab -
    log_success "기존 cron 작업 제거 완료"
fi

# 새 cron 작업 추가
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
log_success "cron 작업 추가 완료"

# cron 서비스 재시작
log_info "cron 서비스를 재시작합니다..."
if sudo systemctl restart cron; then
    log_success "cron 서비스 재시작 완료"
elif sudo service cron restart; then
    log_success "cron 서비스 재시작 완료"
else
    log_warning "cron 서비스 재시작에 실패했습니다. 수동으로 재시작해주세요."
fi

# 로그 파일 생성
sudo touch /var/log/kamf-ssl-renew.log
sudo chmod 644 /var/log/kamf-ssl-renew.log
log_success "로그 파일 생성: /var/log/kamf-ssl-renew.log"

# 설정 확인
echo ""
log_success "🎉 SSL 인증서 자동 갱신 cron 설정이 완료되었습니다!"
echo ""
log_info "📋 설정 정보:"
log_info "- cron 스케줄: 매주 일요일 오전 2시"
log_info "- cron 스크립트: $CRON_SCRIPT"
log_info "- 로그 파일: /var/log/kamf-ssl-renew.log"
echo ""
log_info "📌 확인 명령어:"
log_info "- cron 작업 확인: crontab -l"
log_info "- 로그 확인: tail -f /var/log/kamf-ssl-renew.log"
log_info "- 수동 갱신 테스트: $CRON_SCRIPT"
echo ""
log_info "💡 참고사항:"
log_info "- Let's Encrypt 인증서는 90일마다 갱신됩니다"
log_info "- 갱신은 만료 30일 전부터 가능합니다"
log_info "- 갱신이 불필요한 경우 스크립트는 아무 작업도 하지 않습니다"
echo ""
