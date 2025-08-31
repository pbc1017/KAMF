#!/bin/bash
#
# KAMF 서버 초기 설정 스크립트
# Ubuntu 20.04+ 서버에서 실행하여 배포 환경을 준비합니다.
#
set -e

# 색상 출력 함수
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

# Root 권한 확인
if [[ $EUID -eq 0 ]]; then
   print_error "이 스크립트는 root 권한으로 실행하지 마세요. sudo가 필요한 경우 스크립트 내에서 처리합니다."
   exit 1
fi

print_info "=== KAMF 서버 환경 설정 시작 ==="
print_info "서버 정보: $(uname -a)"
print_info "사용자: $(whoami)"
print_info "홈 디렉토리: $HOME"

# 시스템 패키지 업데이트
print_info "시스템 패키지 업데이트 중..."
sudo apt update && sudo apt upgrade -y
print_success "시스템 패키지 업데이트 완료"

# 필수 패키지 설치
print_info "필수 패키지 설치 중..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    htop \
    tree

print_success "필수 패키지 설치 완료"

# Docker 설치 확인 및 설치
if command -v docker &> /dev/null; then
    print_warning "Docker가 이미 설치되어 있습니다. 버전: $(docker --version)"
else
    print_info "Docker 설치 중..."
    
    # Docker 공식 GPG 키 추가
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Docker 레포지토리 추가
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Docker 설치
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io
    
    # 현재 사용자를 docker 그룹에 추가
    sudo usermod -aG docker $USER
    
    print_success "Docker 설치 완료: $(docker --version)"
fi

# Docker Compose 설치 확인 및 설치
if command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose가 이미 설치되어 있습니다. 버전: $(docker-compose --version)"
else
    print_info "Docker Compose 설치 중..."
    
    # 최신 Docker Compose 다운로드
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d '"' -f 4)
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # 실행 권한 부여
    sudo chmod +x /usr/local/bin/docker-compose
    
    print_success "Docker Compose 설치 완료: $(docker-compose --version)"
fi

# 방화벽 설정
print_info "방화벽(UFW) 설정 중..."
sudo ufw --force enable

# 기본 정책: 나가는 트래픽 허용, 들어오는 트래픽 차단
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 필수 포트 허용
sudo ufw allow ssh
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

print_success "방화벽 설정 완료"
sudo ufw status

# 프로젝트 디렉토리 생성
print_info "프로젝트 디렉토리 구조 생성 중..."

PROJECT_DIR="$HOME/kamf"
mkdir -p $PROJECT_DIR
mkdir -p $PROJECT_DIR/deploy/scripts
mkdir -p $PROJECT_DIR/deploy/logs
mkdir -p $PROJECT_DIR/mysql-init

print_success "프로젝트 디렉토리 생성 완료: $PROJECT_DIR"

# 로그 로테이션 설정
print_info "로그 로테이션 설정 중..."
sudo tee /etc/logrotate.d/kamf > /dev/null <<EOF
$PROJECT_DIR/deploy/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    copytruncate
    create 0644 $(whoami) $(whoami)
}
EOF

print_success "로그 로테이션 설정 완료"

# 시스템 서비스 자동 시작 설정
print_info "시스템 서비스 자동 시작 설정 중..."
sudo systemctl enable docker
sudo systemctl start docker

print_success "Docker 서비스 자동 시작 설정 완료"

# SSH 키 설정 가이드 (정보 제공)
print_info "=== SSH 키 설정 가이드 ==="
print_info "GitHub Actions에서 서버에 접근하려면 SSH 키가 필요합니다:"
print_info ""
print_info "1. 로컬에서 SSH 키 생성:"
print_info "   ssh-keygen -t rsa -b 4096 -C 'github-actions@kamf' -f ~/.ssh/kamf_deploy_key"
print_info ""
print_info "2. 공개키를 서버에 등록:"
print_info "   cat ~/.ssh/kamf_deploy_key.pub >> $HOME/.ssh/authorized_keys"
print_info ""
print_info "3. GitHub Secrets에 개인키 등록:"
print_info "   SERVER_SSH_KEY: (개인키 전체 내용을 복사하여 등록)"
print_info ""

# SSL 인증서 설정 (Certbot)
if [ ! -z "$SSL_DOMAIN" ]; then
    print_info "SSL 인증서 설정 중... (도메인: $SSL_DOMAIN)"
    
    # Certbot 설치
    sudo apt install -y certbot python3-certbot-nginx
    
    # SSL 인증서 발급 (도메인이 설정된 경우)
    print_warning "SSL 인증서 발급을 위해 도메인이 이 서버를 가리키고 있는지 확인하세요."
    print_info "수동으로 인증서를 발급하려면 다음 명령을 실행하세요:"
    print_info "sudo certbot --nginx -d $SSL_DOMAIN"
    
    # 자동 갱신 설정
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    print_success "SSL 인증서 자동 갱신 설정 완료"
else
    print_info "SSL 도메인이 설정되지 않았습니다. 나중에 수동으로 설정할 수 있습니다."
    print_info "Certbot 설치 중..."
    sudo apt install -y certbot python3-certbot-nginx
    print_success "Certbot 설치 완료"
fi

# Docker 컨테이너 자동 시작 스크립트 생성
print_info "Docker 컨테이너 자동 시작 스크립트 생성 중..."
tee $PROJECT_DIR/start-containers.sh > /dev/null <<EOF
#!/bin/bash
# KAMF 컨테이너 자동 시작 스크립트
cd $PROJECT_DIR/deploy
docker-compose up -d
EOF

chmod +x $PROJECT_DIR/start-containers.sh
print_success "자동 시작 스크립트 생성 완료: $PROJECT_DIR/start-containers.sh"

# 시스템 정보 출력
print_info "=== 시스템 정보 ==="
print_info "OS: $(lsb_release -d | cut -f2)"
print_info "Kernel: $(uname -r)"
print_info "Docker: $(docker --version)"
print_info "Docker Compose: $(docker-compose --version)"
print_info "Available Memory: $(free -h | awk 'NR==2{print $2}')"
print_info "Available Disk: $(df -h / | awk 'NR==2{print $4}')"

# 완료 메시지
print_success "=== KAMF 서버 환경 설정 완료 ==="
print_info ""
print_info "다음 단계:"
print_info "1. SSH 키를 설정하여 GitHub Actions에서 접근 가능하도록 구성"
print_info "2. 필요한 경우 도메인을 설정하고 SSL 인증서 발급"
print_info "3. GitHub Actions에서 첫 배포 실행"
print_info ""
print_warning "⚠️  Docker 그룹 설정을 적용하려면 로그아웃 후 다시 로그인하세요."
print_warning "또는 다음 명령을 실행하세요: newgrp docker"
print_info ""
print_info "설정이 완료되었습니다! 🎉"

exit 0
