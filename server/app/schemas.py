from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator

PriorityLevel = Literal["urgent", "high", "medium", "low"]


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


class AuthResponse(BaseModel):
    user: UserResponse
    token: Optional[str] = None
    message: Optional[str] = None

    model_config = ConfigDict(serialize_by_alias=True)


class TaskCreateSchema(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    priority: Optional[PriorityLevel] = "medium"
    dueDate: Optional[datetime] = Field(None, alias="dueDate")
    tag: Optional[str] = Field(None, max_length=50)

    model_config = ConfigDict(populate_by_name=True)

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

    @field_validator("tag")
    @classmethod
    def clean_tag(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip().lower()
        # Remove any leading hash if user types #work
        if trimmed.startswith("#"):
            trimmed = trimmed[1:].strip()
        return trimmed if trimmed else None


class TaskUpdateSchema(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    completed: Optional[bool] = None
    priority: Optional[PriorityLevel] = None
    dueDate: Optional[datetime] = Field(None, alias="dueDate")
    tag: Optional[str] = Field(None, max_length=50)

    model_config = ConfigDict(populate_by_name=True)

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

    @field_validator("tag")
    @classmethod
    def clean_tag(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip().lower()
        if trimmed.startswith("#"):
            trimmed = trimmed[1:].strip()
        return trimmed if trimmed else None


class TaskResponse(BaseModel):
    id: str
    userId: str = Field(..., alias="userId")
    title: str
    description: Optional[str] = None
    completed: bool
    priority: str
    dueDate: Optional[datetime] = Field(None, alias="dueDate")
    tag: Optional[str] = None
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


class TaskStatsResponse(BaseModel):
    total: int
    pending: int
    completed: int
    completedToday: int
    overdue: int
    urgent: int

    model_config = ConfigDict(serialize_by_alias=True)


class MessageResponse(BaseModel):
    message: str
