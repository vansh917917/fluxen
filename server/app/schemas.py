from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


class UserRegisterSchema(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)


class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    id: str
    email: str
    createdAt: datetime = Field(..., alias="createdAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        serialize_by_alias=True,
    )

    @field_validator("createdAt", mode="before")
    @classmethod
    def set_created_at(cls, v):
        return v


class AuthResponse(BaseModel):
    user: UserResponse
    token: Optional[str] = None
    message: Optional[str] = None

    model_config = ConfigDict(serialize_by_alias=True)


class TaskCreateSchema(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)

    @field_validator("title")
    @classmethod
    def clean_title(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Task title cannot be empty")
        return trimmed

    @field_validator("description")
    @classmethod
    def clean_description(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        return trimmed if trimmed else None


class TaskUpdateSchema(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    completed: Optional[bool] = None

    @field_validator("title")
    @classmethod
    def clean_title(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Task title cannot be empty")
        return trimmed

    @field_validator("description")
    @classmethod
    def clean_description(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        return trimmed if trimmed else None


class TaskResponse(BaseModel):
    id: str
    userId: str = Field(..., alias="userId")
    title: str
    description: Optional[str] = None
    completed: bool
    createdAt: datetime = Field(..., alias="createdAt")
    updatedAt: datetime = Field(..., alias="updatedAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        serialize_by_alias=True,
    )


class TaskListResponse(BaseModel):
    tasks: List[TaskResponse]

    model_config = ConfigDict(serialize_by_alias=True)


class TaskItemResponse(BaseModel):
    task: TaskResponse
    message: Optional[str] = None

    model_config = ConfigDict(serialize_by_alias=True)


class MessageResponse(BaseModel):
    message: str
