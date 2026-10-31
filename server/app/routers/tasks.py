import io
import csv
from datetime import datetime, timezone, time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import case
from app.database import get_db
from app.models import User, Task
from app.schemas import (
    TaskCreateSchema,
    TaskUpdateSchema,
    TaskResponse,
    TaskListResponse,
    TaskItemResponse,
    TaskStatsResponse,
    MessageResponse,
)
from app.auth import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def to_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


@router.get("/stats", response_model=TaskStatsResponse, status_code=status.HTTP_200_OK)
def get_task_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    now = datetime.now(timezone.utc)
    today_start = datetime.combine(now.date(), time.min).replace(tzinfo=timezone.utc)

    total = len(tasks)
    completed = 0
    pending = 0
    completed_today = 0
    overdue = 0
    urgent = 0

    for t in tasks:
        up_at = to_utc(t.updated_at)
        due_at = to_utc(t.due_date)

        if t.completed:
            completed += 1
            if up_at and up_at >= today_start:
                completed_today += 1
        else:
            pending += 1
            if due_at and due_at < now:
                overdue += 1
            if t.priority == "urgent":
                urgent += 1

    return TaskStatsResponse(
        total=total,
        pending=pending,
        completed=completed,
        completedToday=completed_today,
        overdue=overdue,
        urgent=urgent,
    )


@router.get("/export", status_code=status.HTTP_200_OK)
def export_tasks(
    export_format: str = Query("json", alias="format"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tasks = (
        db.query(Task)
        .filter(Task.user_id == current_user.id)
        .order_by(Task.created_at.desc())
        .all()
    )

    if export_format.lower() == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Title", "Description", "Status", "Priority", "Due Date", "Tag", "Created At"])
        for t in tasks:
            writer.writerow([
                t.id,
                t.title,
                t.description or "",
                "Completed" if t.completed else "Pending",
                t.priority,
                t.due_date.isoformat() if t.due_date else "",
                t.tag or "",
                t.created_at.isoformat() if t.created_at else "",
            ])
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="fluxen_tasks.csv"'},
        )

    # Default to JSON export
    return {
        "exportDate": datetime.now(timezone.utc).isoformat(),
        "userEmail": current_user.email,
        "totalTasks": len(tasks),
        "tasks": [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "completed": t.completed,
                "priority": t.priority,
                "dueDate": t.due_date.isoformat() if t.due_date else None,
                "tag": t.tag,
                "createdAt": t.created_at.isoformat() if t.created_at else None,
            }
            for t in tasks
        ],
    }


@router.get("", response_model=TaskListResponse, status_code=status.HTTP_200_OK)
def get_tasks(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    tag_filter: Optional[str] = Query(None, alias="tag"),
    sort_by: Optional[str] = Query(None, alias="sort"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Task).filter(Task.user_id == current_user.id)

    if status_filter == "completed":
        query = query.filter(Task.completed == True)
    elif status_filter == "pending":
        query = query.filter(Task.completed == False)

    if priority_filter and priority_filter in ("urgent", "high", "medium", "low"):
        query = query.filter(Task.priority == priority_filter)

    if tag_filter:
        clean_tag = tag_filter.strip().lower()
        if clean_tag.startswith("#"):
            clean_tag = clean_tag[1:].strip()
        query = query.filter(Task.tag == clean_tag)

    # Sorting
    if sort_by == "dueDate":
        query = query.order_by(Task.due_date.asc().nulls_last(), Task.created_at.desc())
    elif sort_by == "priority":
        priority_order = case(
            (Task.priority == "urgent", 1),
            (Task.priority == "high", 2),
            (Task.priority == "medium", 3),
            (Task.priority == "low", 4),
            else_=5,
        )
        query = query.order_by(priority_order, Task.created_at.desc())
    else:
        query = query.order_by(Task.created_at.desc())

    tasks = query.all()

    return TaskListResponse(
        tasks=[
            TaskResponse(
                id=t.id,
                userId=t.user_id,
                title=t.title,
                description=t.description,
                completed=t.completed,
                priority=t.priority or "medium",
                dueDate=t.due_date,
                tag=t.tag,
                createdAt=t.created_at,
                updatedAt=t.updated_at,
            )
            for t in tasks
        ]
    )


@router.post("", response_model=TaskItemResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    data: TaskCreateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = Task(
        user_id=current_user.id,
        title=data.title,
        description=data.description,
        completed=False,
        priority=data.priority or "medium",
        due_date=data.dueDate,
        tag=data.tag,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    return TaskItemResponse(
        task=TaskResponse(
            id=task.id,
            userId=task.user_id,
            title=task.title,
            description=task.description,
            completed=task.completed,
            priority=task.priority,
            dueDate=task.due_date,
            tag=task.tag,
            createdAt=task.created_at,
            updatedAt=task.updated_at,
        ),
        message="Task created successfully",
    )


@router.get("/{task_id}", response_model=TaskItemResponse, status_code=status.HTTP_200_OK)
def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    return TaskItemResponse(
        task=TaskResponse(
            id=task.id,
            userId=task.user_id,
            title=task.title,
            description=task.description,
            completed=task.completed,
            priority=task.priority,
            dueDate=task.due_date,
            tag=task.tag,
            createdAt=task.created_at,
            updatedAt=task.updated_at,
        )
    )


@router.patch("/{task_id}", response_model=TaskItemResponse, status_code=status.HTTP_200_OK)
def update_task(
    task_id: str,
    data: TaskUpdateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    if data.title is not None:
        task.title = data.title
    if data.description is not None:
        task.description = data.description
    if data.completed is not None:
        task.completed = data.completed
    if data.priority is not None:
        task.priority = data.priority
    if data.dueDate is not None or "dueDate" in data.model_fields_set:
        task.due_date = data.dueDate
    if data.tag is not None or "tag" in data.model_fields_set:
        task.tag = data.tag

    db.commit()
    db.refresh(task)

    return TaskItemResponse(
        task=TaskResponse(
            id=task.id,
            userId=task.user_id,
            title=task.title,
            description=task.description,
            completed=task.completed,
            priority=task.priority,
            dueDate=task.due_date,
            tag=task.tag,
            createdAt=task.created_at,
            updatedAt=task.updated_at,
        ),
        message="Task updated successfully",
    )


@router.delete("/{task_id}", response_model=MessageResponse, status_code=status.HTTP_200_OK)
def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    db.delete(task)
    db.commit()

    return MessageResponse(message="Task deleted successfully")
