#!/bin/bash
set -e

echo "=== Installing Node.js, Git, and Nginx on frontend ==="
sudo apt-get update -y
sudo apt-get install -y git nginx curl

if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "=== Node version ==="
node -v
npm -v

echo "=== Cloning / Updating repository ==="
cd /home/ubuntu
if [ -d "fluxen" ]; then
  cd fluxen && git pull origin main
else
  git clone https://github.com/vansh917917/fluxen.git && cd fluxen
fi

cd client

echo "=== Configuring environment ==="
echo "VITE_API_BASE_URL=http://13.211.97.177:5000/api" > .env

echo "=== Installing npm dependencies ==="
npm install

echo "=== Building React application ==="
npm run build

echo "=== Setting up web directory ==="
sudo mkdir -p /var/www/fluxen
sudo cp -r dist/* /var/www/fluxen/
sudo chown -R www-data:www-data /var/www/fluxen

echo "=== Configuring Nginx ==="
sudo cp nginx.conf /etc/nginx/sites-available/fluxen
sudo ln -sf /etc/nginx/sites-available/fluxen /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl restart nginx

echo "=== Checking frontend HTTP response ==="
curl -i http://localhost

echo "=== Frontend setup finished successfully ==="
