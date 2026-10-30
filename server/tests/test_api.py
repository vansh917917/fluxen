import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base, get_db
from app.main import app

# In-memory SQLite for testing with StaticPool so all connections share the same memory DB
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

# Create tables in the test database
Base.metadata.create_all(bind=test_engine)

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

    api_response = client.get("/api/health")
    assert api_response.status_code == 200
    assert api_response.json()["status"] == "ok"


def test_validation_errors():
    # Invalid email
    res1 = client.post(
        "/api/auth/register",
        json={"email": "not-an-email", "password": "password123"},
    )
    assert res1.status_code == 400

    # Short password
    res2 = client.post(
        "/api/auth/register",
        json={"email": "valid@example.com", "password": "123"},
    )
    assert res2.status_code == 400


def test_auth_workflow_and_task_crud():
    # 1. Register User A
    register_res = client.post(
        "/api/auth/register",
        json={"email": "alice@example.com", "password": "password123"},
    )
    assert register_res.status_code == 201
    user_data = register_res.json()
    assert "token" in user_data
    assert user_data["user"]["email"] == "alice@example.com"
    token_a = user_data["token"]

    # 2. Prevent duplicate registration
    duplicate_res = client.post(
        "/api/auth/register",
        json={"email": "alice@example.com", "password": "password123"},
    )
    assert duplicate_res.status_code == 400

    # 3. Login
    login_res = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "password123"},
    )
    assert login_res.status_code == 200
    assert login_res.json()["user"]["email"] == "alice@example.com"

    # 4. Reject invalid login
    bad_login = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "wrongpassword"},
    )
    assert bad_login.status_code == 401

    # 5. Get Me
    headers_a = {"Authorization": f"Bearer {token_a}"}
    me_res = client.get("/api/auth/me", headers=headers_a)
    assert me_res.status_code == 200
    assert me_res.json()["user"]["email"] == "alice@example.com"

    # 6. Reject empty task title
    empty_task = client.post(
        "/api/tasks",
        headers=headers_a,
        json={"title": "   ", "description": ""},
    )
    assert empty_task.status_code == 400

    # 7. Create Task 1 (Pending)
    task1_res = client.post(
        "/api/tasks",
        headers=headers_a,
        json={"title": "First Test Task", "description": "Details here"},
    )
    assert task1_res.status_code == 201
    t1 = task1_res.json()["task"]
    assert t1["title"] == "First Test Task"
    assert t1["completed"] is False
    t1_id = t1["id"]

    # 8. Create Task 2
    task2_res = client.post(
        "/api/tasks",
        headers=headers_a,
        json={"title": "Second Test Task", "description": "Second desc"},
    )
    assert task2_res.status_code == 201
    t2_id = task2_res.json()["task"]["id"]

    # 9. Mark Task 2 Completed
    client.patch(
        f"/api/tasks/{t2_id}",
        headers=headers_a,
        json={"completed": True},
    )

    # 10. Filter tasks: all, pending, completed
    all_tasks = client.get("/api/tasks", headers=headers_a).json()["tasks"]
    assert len(all_tasks) == 2

    pending_tasks = client.get("/api/tasks?status=pending", headers=headers_a).json()["tasks"]
    assert len(pending_tasks) == 1
    assert pending_tasks[0]["id"] == t1_id

    completed_tasks = client.get("/api/tasks?status=completed", headers=headers_a).json()["tasks"]
    assert len(completed_tasks) == 1
    assert completed_tasks[0]["id"] == t2_id

    # 11. Test Ownership Isolation with User B
    reg_b = client.post(
        "/api/auth/register",
        json={"email": "bob@example.com", "password": "password456"},
    )
    assert reg_b.status_code == 201
    token_b = reg_b.json()["token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User B should see 0 tasks
    b_tasks = client.get("/api/tasks", headers=headers_b)
    assert b_tasks.status_code == 200
    assert len(b_tasks.json()["tasks"]) == 0

    # User B cannot access User A's task
    b_get_a_task = client.get(f"/api/tasks/{t1_id}", headers=headers_b)
    assert b_get_a_task.status_code == 404

    # User B cannot update User A's task
    b_up_a_task = client.patch(f"/api/tasks/{t1_id}", headers=headers_b, json={"title": "Hacked"})
    assert b_up_a_task.status_code == 404

    # User B cannot delete User A's task
    b_del_a_task = client.delete(f"/api/tasks/{t1_id}", headers=headers_b)
    assert b_del_a_task.status_code == 404

    # 12. User A Deletes Task 1
    del_res = client.delete(f"/api/tasks/{t1_id}", headers=headers_a)
    assert del_res.status_code == 200

    # 13. Logout
    logout_res = client.post("/api/auth/logout")
    assert logout_res.status_code == 200
