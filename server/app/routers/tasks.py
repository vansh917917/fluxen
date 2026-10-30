from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Task
from app.schemas import (
    TaskCreateSchema,
    TaskUpdateSchema,
    TaskResponse,
    TaskListResponse,
    TaskItemResponse,
    MessageResponse,
)
from app.auth import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("", response_model=TaskListResponse, status_code=status.HTTP_200_OK)
def get_tasks(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Task).filter(Task.user_id == current_user.id)

    if status_filter == "completed":
        query = query.filter(Task.completed == True)
    elif status_filter == "pending":
        query = query.filter(Task.completed == False)

    tasks = query.order_by(Task.created_at.desc()).all()

    return TaskListResponse(
        tasks=[
            TaskResponse(
                id=t.id,
                userId=t.user_id,
                title=t.title,
                description=t.description,
                completed=t.completed,
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

    db.commit()
    db.refresh(task)

    return TaskItemResponse(
        task=TaskResponse(
            id=task.id,
            userId=task.user_id,
            title=task.title,
            description=task.description,
            completed=task.completed,
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
