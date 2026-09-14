#!/bin/bash
# ==============================================================================
# SCRIPT OTOMATISASI FIREWALL & INTRUSION PREVENTION (UFW & FAIL2BAN)
# Target OS: Ubuntu 22.04 / 24.04 LTS / Debian
# ==============================================================================

set -e

echo "🚀 [1/4] Memperbarui paket sistem..."
sudo apt update && sudo apt upgrade -y

echo "📦 [2/4] Menginstall UFW & Fail2ban..."
sudo apt install -y ufw fail2ban

echo "🛡️ [3/4] Mengonfigurasi UFW (Uncomplicated Firewall)..."
# Kebijakan Default: Blokir semua incoming, izinkan outgoing
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Buka Port SSH (Ganti port 22 jika menggunakan custom SSH port)
sudo ufw allow 22/tcp comment 'SSH Port'

# Buka Port Web Standar (HTTP & HTTPS)
sudo ufw allow 80/tcp comment 'HTTP Web'
sudo ufw allow 443/tcp comment 'HTTPS Secure Web'

# Aktifkan UFW
echo "y" | sudo ufw enable
sudo ufw status verbose

echo "🛑 [4/4] Mengonfigurasi Fail2ban untuk Auto-Ban Brute Force..."
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Buat jail khusus SSH dan Nginx HTTP Auth
sudo bash -c 'cat > /etc/fail2ban/jail.d/custom-security.local << EOF
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 1h
findtime = 10m

[nginx-req-limit]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
bantime = 30m
findtime = 1m
EOF'

sudo systemctl restart fail2ban
sudo systemctl enable fail2ban

echo "✅ Sistem Pertahanan Firewall & Fail2ban Berhasil Diaktifkan!"
