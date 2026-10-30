# Fluxen

Fluxen is a lightweight, full-stack personal task management web application built with React, TypeScript, Vite, Tailwind CSS, Express, Prisma, and PostgreSQL.

## Architecture

The project contains two separate standalone applications in a single repository:

- `server`: Express REST API in TypeScript with Prisma ORM and PostgreSQL.
- `client`: Single-page application in React, TypeScript, and Tailwind CSS built with Vite.

This decoupled architecture allows deploying the frontend and backend on two separate hosting targets, such as two distinct AWS EC2 instances.

---

## Local Development Setup

### Prerequisites

- Node.js 18+ (tested on Node 22)
- npm 10+
- PostgreSQL database (local, containerized, or managed)

### 1. Install Dependencies

Install dependencies for both frontend and backend:

```bash
npm run install:all
```

Alternatively:

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure Environment Variables

**Backend (`server/.env`)**:

Create `server/.env` based on `server/.env.example`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fluxen_db?schema=public"
JWT_SECRET=replace_with_a_secure_jwt_secret_key
SESSION_SECRET=replace_with_a_secure_session_secret_key
```

**Frontend (`client/.env`)**:

Create `client/.env` based on `client/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Initialize Database and Run Migrations

From the root directory or inside `server`:

```bash
cd server
npx prisma generate
npx prisma migrate deploy
```

### 4. Run the Development Servers

Open two terminals:

Terminal 1 (Backend API):
```bash
npm run dev:server
```
Runs at `http://localhost:5000`

Terminal 2 (Frontend Client):
```bash
npm run dev:client
```
Runs at `http://localhost:5173`

### 5. Running Tests

Run backend unit tests for validation schemas, password hashing, and authentication tokens:

```bash
npm test
```

---

## Local Docker Deployment (Optional)

To run the complete system (PostgreSQL, backend, and frontend) in Docker:

```bash
docker compose up --build -d
```

Frontend will be available at `http://localhost:80` and backend at `http://localhost:5000`.

---

## Deploying to Two AWS EC2 Instances

### Architecture Overview

```
User Browser
    │
    ├─── HTTP (Port 80) ────> [ EC2 Instance 1: Frontend ]
    │                         Nginx serving React build
    │
    └─── REST (Port 5000) ──> [ EC2 Instance 2: Backend ]
                              Express API + Prisma ORM
                                      │
                                      ▼
                              [ PostgreSQL Database ]
                              (Local on Backend EC2 or AWS RDS)
```

### Step 1: Launch EC2 Instances

Launch two Amazon EC2 instances (Ubuntu 22.04 LTS or 24.04 LTS recommended, `t3.micro` or `t3.small`):

1. **Instance 1 (Backend)**: Name: `fluxen-backend`
2. **Instance 2 (Frontend)**: Name: `fluxen-frontend`

### Step 2: Configure AWS Security Groups

**Backend Security Group (`fluxen-backend-sg`)**:
- Port 22 (SSH): Your IP
- Port 5000 (Custom TCP): Anywhere (`0.0.0.0/0`) or restricted to Frontend EC2 Public IP
- Port 5432 (PostgreSQL): Only required if database is hosted on this instance and accessed externally

**Frontend Security Group (`fluxen-frontend-sg`)**:
- Port 22 (SSH): Your IP
- Port 80 (HTTP): Anywhere (`0.0.0.0/0`)
- Port 443 (HTTPS): Anywhere (`0.0.0.0/0`)

---

### Step 3: Setup Backend EC2 Instance

1. SSH into the backend instance:
```bash
ssh -i your-key.pem ubuntu@<BACKEND_PUBLIC_IP>
```

2. Install Node.js, npm, Git, and PostgreSQL:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl postgresql postgresql-contrib

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

3. Set up PostgreSQL:
```bash
sudo -u postgres psql -c "CREATE USER fluxenuser WITH PASSWORD 'secure_db_password';"
sudo -u postgres psql -c "CREATE DATABASE fluxen_db OWNER fluxenuser;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE fluxen_db TO fluxenuser;"
```

4. Clone the repository and configure:
```bash
git clone https://github.com/vansh917917/fluxen.git
cd fluxen/server
npm install
```

5. Create `.env` file:
```bash
nano .env
```
Fill in the values:
```env
PORT=5000
NODE_ENV=production
CLIENT_URL=http://<FRONTEND_PUBLIC_IP>
DATABASE_URL="postgresql://fluxenuser:secure_db_password@localhost:5432/fluxen_db?schema=public"
JWT_SECRET=generate_a_random_32_character_secret_here
SESSION_SECRET=generate_another_random_secret_here
```

6. Generate Prisma client, apply migrations, and build:
```bash
npx prisma generate
npx prisma migrate deploy
npm run build
```

7. Run with PM2 for background process management:
```bash
sudo npm install -g pm2
pm2 start dist/index.js --name fluxen-backend
pm2 save
pm2 startup
```

Verify backend health:
```bash
curl http://localhost:5000/health
```

---

### Step 4: Setup Frontend EC2 Instance

1. SSH into the frontend instance:
```bash
ssh -i your-key.pem ubuntu@<FRONTEND_PUBLIC_IP>
```

2. Install Node.js, npm, Git, and Nginx:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx curl

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

3. Clone the repository and install dependencies:
```bash
git clone https://github.com/vansh917917/fluxen.git
cd fluxen/client
npm install
```

4. Configure `.env` with the backend EC2 IP:
```bash
nano .env
```
Set the backend API endpoint:
```env
VITE_API_BASE_URL=http://<BACKEND_PUBLIC_IP>:5000/api
```

5. Build the frontend:
```bash
npm run build
```

6. Deploy build to web directory:
```bash
sudo mkdir -p /var/www/fluxen
sudo cp -r dist/* /var/www/fluxen/
sudo chown -R www-data:www-data /var/www/fluxen
```

7. Configure Nginx:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/fluxen
sudo ln -sf /etc/nginx/sites-available/fluxen /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

8. Open `http://<FRONTEND_PUBLIC_IP>` in your web browser. Fluxen is now live!

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
