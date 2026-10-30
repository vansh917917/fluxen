#!/bin/bash
set -e
echo "=== Installing dependencies on backend ==="
sudo apt-get update -y
sudo apt-get install -y python3-pip python3-venv git

echo "=== Cloning / Updating repository ==="
cd /home/ubuntu
if [ -d "fluxen" ]; then
  cd fluxen && git pull origin main
else
  git clone https://github.com/vansh917917/fluxen.git && cd fluxen
fi

cd server

echo "=== Setting up Python environment ==="
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

echo "=== Writing .env ==="
cat << 'ENVFILE' > .env
PORT=5000
NODE_ENV=production
CLIENT_URL=http://16.178.32.74,http://16.178.32.74:80
DATABASE_URL=sqlite:///./fluxen.db
JWT_SECRET=super_secret_production_key_fluxen_prod_2026
ENVFILE

echo "=== Configuring systemd service ==="
sudo bash -c 'cat << "SVCFILE" > /etc/systemd/system/fluxen.service
[Unit]
Description=Fluxen FastAPI Backend Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/fluxen/server
ExecStart=/home/ubuntu/fluxen/server/venv/bin/python run.py
Restart=always
RestartSec=3
EnvironmentFile=/home/ubuntu/fluxen/server/.env

[Install]
WantedBy=multi-user.target
SVCFILE'

sudo systemctl daemon-reload
sudo systemctl enable --now fluxen
sudo systemctl restart fluxen

sleep 3
echo "=== Checking backend health ==="
curl -i http://localhost:5000/health
echo "=== Backend setup finished successfully ==="
