# Fluxen

Fluxen is a fast, full-stack personal task management application built with Python FastAPI, SQLite, and React (TypeScript + Vite + Tailwind CSS).

## Highlights

- **Linear-style Quick Add**: Create tasks instantly from the top bar with `Enter`.
- **Keyboard Shortcuts**: Power-user navigation (`N` for new task, `/` for search, `?` for cheat sheet, `Esc` to close dialogs).
- **Priority Levels**: Color-coded badges for Urgent, High, Medium, and Low priorities.
- **Due Dates & Overdue Alerts**: Clear tracking for deadlines with relative indicators (Overdue, Due Today, Tomorrow).
- **Context Tags**: Filter tasks with custom labels (e.g., `#work`, `#personal`, `#study`).
- **Undo on Delete**: Non-blocking toast notification allows restoring deleted tasks within 6 seconds.
- **Data Portability**: Instant one-click export of personal tasks in both CSV and JSON formats.
- **Decoupled Architecture**: Designed to run across two independent AWS EC2 instances (one for FastAPI, one for React/Nginx).

---

## Local Development Setup

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

3. Install dependencies and start server:
   ```bash
   pip install -r requirements.txt
   python run.py
   ```
   Backend runs at: `http://localhost:5000` (interactive API documentation at `http://localhost:5000/docs`).

### 2. Start the Frontend

In a second terminal:

1. Navigate to `client`:
   ```bash
   cd client
   npm install
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

## Deploying to Two AWS EC2 Instances

### Overview

- **Instance 1 (Backend)**: Python FastAPI with Uvicorn (managed by systemd) on port 5000.
- **Instance 2 (Frontend)**: React production build served via Nginx on port 80 with reverse proxy to backend.

### Step 1: Launch Instances

Launch two Amazon EC2 Ubuntu instances (`t3.micro` or `t2.micro`):
1. `fluxen-backend`
2. `fluxen-frontend`

### Step 2: Configure Security Groups

- **Backend SG**: Port 22 (SSH) open to Frontend instance or management IP.
- **Frontend SG**: Port 80 (HTTP) and Port 22 (SSH) open to Anywhere (`0.0.0.0/0`).

---

### Step 3: Setup Backend EC2 Instance

1. SSH into the backend instance:
   ```bash
   ssh -i fluxen-key.pem ubuntu@<BACKEND_PUBLIC_IP>
   ```

2. Run automated setup:
   ```bash
   git clone https://github.com/vansh917917/fluxen.git
   cd fluxen
   chmod +x deploy_backend.sh
   ./deploy_backend.sh
   ```

---

### Step 4: Setup Frontend EC2 Instance

1. SSH into the frontend instance:
   ```bash
   ssh -i fluxen-key.pem ubuntu@<FRONTEND_PUBLIC_IP>
   ```

2. Run automated setup:
   ```bash
   git clone https://github.com/vansh917917/fluxen.git
   cd fluxen
   chmod +x deploy_frontend.sh
   ./deploy_frontend.sh
   ```

3. Open `http://<FRONTEND_PUBLIC_IP>` in your browser.

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Authenticate an existing user | No |
| POST | `/api/auth/logout` | End user session | No |
| GET | `/api/auth/me` | Fetch authenticated user profile | Yes |

### Tasks

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/tasks` | Get user tasks (supports `status`, `priority`, `tag`, `sort`) | Yes |
| GET | `/api/tasks/stats` | Retrieve progress metrics (total, pending, done today, overdue, urgent) | Yes |
| GET | `/api/tasks/export` | Export tasks as JSON or CSV (`?format=json` or `csv`) | Yes |
| POST | `/api/tasks` | Create a new task | Yes |
| GET | `/api/tasks/:id` | Get specific task by ID | Yes |
| PATCH | `/api/tasks/:id` | Update task title, description, priority, due date, or tag | Yes |
| DELETE | `/api/tasks/:id` | Delete a task | Yes |
