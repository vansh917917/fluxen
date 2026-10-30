# Fluxen

Fluxen is a lightweight, full-stack personal task management application built with Python FastAPI, SQLite, and a React (TypeScript + Vite + Tailwind CSS) frontend.

## Architecture

The project consists of two clean, decoupled applications:

- `server`: Python FastAPI REST API with SQLAlchemy ORM and an automatic local SQLite database (`fluxen.db`).
- `client`: React SPA built with TypeScript, Vite, and Tailwind CSS.

---

## Quick Start (Local Setup)

### Prerequisites

- Python 3.10+ (tested on Python 3.13)
- Node.js 18+ and npm

### 1. Start the Backend

1. Navigate to `server` and create a virtual environment:
   ```bash
   cd server
   python -m venv venv
   ```

2. Activate the virtual environment:
   - **Windows**:
     ```powershell
     .\venv\Scripts\activate
     ```
   - **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the server (auto-creates `fluxen.db`):
   ```bash
   python run.py
   ```
   Backend runs at: `http://localhost:5000` (interactive API docs at `http://localhost:5000/docs`).

### 2. Start the Frontend

In a second terminal:

1. Navigate to `client`:
   ```bash
   cd client
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```
   Frontend runs at: `http://localhost:5173`.

---

## Running Tests

Run backend tests using pytest:

```bash
cd server
venv\Scripts\pytest
```

---

## One-Command Docker Setup

Run both the FastAPI backend and React frontend with Docker Compose:

```bash
docker compose up --build -d
```

- Frontend: `http://localhost:80`
- Backend API: `http://localhost:5000`

---

## Deploying to Two AWS EC2 Instances

### Overview

- **Instance 1 (Backend)**: Python FastAPI with Uvicorn (managed by systemd or PM2) on port 5000.
- **Instance 2 (Frontend)**: React production build served via Nginx on port 80.

### Step 1: Launch Two EC2 Instances

Launch two Amazon EC2 Ubuntu instances (`t3.micro` or `t3.nano`):
1. `fluxen-backend`
2. `fluxen-frontend`

### Step 2: Configure Security Groups

- **Backend SG**: Inbound TCP port 5000 (from anywhere or restricted to Frontend IP), port 22 (SSH).
- **Frontend SG**: Inbound TCP port 80 (HTTP) and port 443 (HTTPS) from anywhere, port 22 (SSH).

---

### Step 3: Setup Backend EC2 Instance

1. SSH into the backend instance:
   ```bash
   ssh -i your-key.pem ubuntu@<BACKEND_PUBLIC_IP>
   ```

2. Install Python and Git:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y python3-pip python3-venv git
   ```

3. Clone the repository:
   ```bash
   git clone https://github.com/vansh917917/fluxen.git
   cd fluxen/server
   ```

4. Set up virtual environment and install dependencies:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

5. Configure `.env`:
   ```bash
   cat << 'EOF' > .env
   PORT=5000
   NODE_ENV=production
   CLIENT_URL=http://<FRONTEND_PUBLIC_IP>
   DATABASE_URL=sqlite:///./fluxen.db
   JWT_SECRET=generate_a_secure_random_secret_here
   EOF
   ```

6. Run FastAPI as a systemd service:
   ```bash
   sudo cat << 'EOF' > /etc/systemd/system/fluxen.service
   [Unit]
   Description=Fluxen FastAPI Backend Service
   After=network.target

   [Service]
   User=ubuntu
   WorkingDirectory=/home/ubuntu/fluxen/server
   ExecStart=/home/ubuntu/fluxen/server/venv/bin/python run.py
   Restart=always
   RestartSec=5
   EnvironmentFile=/home/ubuntu/fluxen/server/.env

   [Install]
   WantedBy=multi-user.target
   EOF

   sudo systemctl daemon-reload
   sudo systemctl enable fluxen
   sudo systemctl start fluxen
   ```

7. Check health:
   ```bash
   curl http://localhost:5000/health
   ```

---

### Step 4: Setup Frontend EC2 Instance

1. SSH into the frontend instance:
   ```bash
   ssh -i your-key.pem ubuntu@<FRONTEND_PUBLIC_IP>
   ```

2. Install Node.js, Git, and Nginx:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y git nginx curl
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. Clone repository and install dependencies:
   ```bash
   git clone https://github.com/vansh917917/fluxen.git
   cd fluxen/client
   npm install
   ```

4. Configure `.env` with backend EC2 IP:
   ```bash
   echo "VITE_API_BASE_URL=http://<BACKEND_PUBLIC_IP>:5000/api" > .env
   ```

5. Build the React frontend:
   ```bash
   npm run build
   ```

6. Deploy to Nginx:
   ```bash
   sudo mkdir -p /var/www/fluxen
   sudo cp -r dist/* /var/www/fluxen/
   sudo cp nginx.conf /etc/nginx/sites-available/fluxen
   sudo ln -sf /etc/nginx/sites-available/fluxen /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. Open `http://<FRONTEND_PUBLIC_IP>` in your browser.

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Authenticate an existing user | No |
| POST | `/api/auth/logout` | End user session | No |
| GET | `/api/auth/me` | Fetch authenticated user data | Yes |

### Tasks

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/tasks` | Get user tasks (supports `?status=all/pending/completed`) | Yes |
| POST | `/api/tasks` | Create a new task | Yes |
| GET | `/api/tasks/:id` | Get specific task by ID | Yes |
| PATCH | `/api/tasks/:id` | Update task title, description, or completed status | Yes |
| DELETE | `/api/tasks/:id` | Delete a task | Yes |
