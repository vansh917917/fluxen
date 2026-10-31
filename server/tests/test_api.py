import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base, get_db
from app.main import app

# In-memory SQLite for testing with StaticPool
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

Base.metadata.create_all(bind=test_engine)

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_advanced_task_features():
    # 1. Register User
    reg = client.post(
        "/api/auth/register",
        json={"email": "pro@fluxen.com", "password": "password123"},
    )
    assert reg.status_code == 201
    token = reg.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create tasks with priorities, due dates, and tags
    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()

    # Task 1: Urgent overdue task
    t1_res = client.post(
        "/api/tasks",
        headers=headers,
        json={
            "title": "Fix critical production bug",
            "priority": "urgent",
            "dueDate": yesterday,
            "tag": "engineering",
        },
    )
    assert t1_res.status_code == 201
    t1 = t1_res.json()["task"]
    assert t1["priority"] == "urgent"
    assert t1["tag"] == "engineering"

    # Task 2: High priority task for tomorrow
    t2_res = client.post(
        "/api/tasks",
        headers=headers,
        json={
            "title": "Prepare sprint roadmap",
            "priority": "high",
            "dueDate": tomorrow,
            "tag": "planning",
        },
    )
    assert t2_res.status_code == 201

    # Task 3: Low priority task completed
    t3_res = client.post(
        "/api/tasks",
        headers=headers,
        json={
            "title": "Organize workspace desk",
            "priority": "low",
            "tag": "personal",
        },
    )
    assert t3_res.status_code == 201
    t3_id = t3_res.json()["task"]["id"]

    client.patch(
        f"/api/tasks/{t3_id}",
        headers=headers,
        json={"completed": True},
    )

    # 3. Test Stats endpoint
    stats_res = client.get("/api/tasks/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total"] == 3
    assert stats["pending"] == 2
    assert stats["completed"] == 1
    assert stats["overdue"] == 1  # Task 1 is overdue
    assert stats["urgent"] == 1   # Task 1 is urgent

    # 4. Test Filtering by priority
    urgent_tasks = client.get("/api/tasks?priority=urgent", headers=headers).json()["tasks"]
    assert len(urgent_tasks) == 1
    assert urgent_tasks[0]["title"] == "Fix critical production bug"

    # 5. Test Filtering by tag
    plan_tasks = client.get("/api/tasks?tag=planning", headers=headers).json()["tasks"]
    assert len(plan_tasks) == 1
    assert plan_tasks[0]["title"] == "Prepare sprint roadmap"

    # 6. Test JSON Export
    json_export = client.get("/api/tasks/export?format=json", headers=headers)
    assert json_export.status_code == 200
    data = json_export.json()
    assert data["totalTasks"] == 3
    assert len(data["tasks"]) == 3

    # 7. Test CSV Export
    csv_export = client.get("/api/tasks/export?format=csv", headers=headers)
    assert csv_export.status_code == 200
    assert "text/csv" in csv_export.headers["content-type"]
    assert "Fix critical production bug" in csv_export.text
