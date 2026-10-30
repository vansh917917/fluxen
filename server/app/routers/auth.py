from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import (
    UserRegisterSchema,
    UserLoginSchema,
    AuthResponse,
    UserResponse,
    MessageResponse,
)
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    set_auth_cookie,
    clear_auth_cookie,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: UserRegisterSchema,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    existing_user = db.query(User).filter(User.email == data.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    pwd_hash = hash_password(data.password)

    new_user = User(
        email=data.email.lower(),
        password_hash=pwd_hash,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"id": new_user.id, "email": new_user.email})
    set_auth_cookie(response, token, request)

    return AuthResponse(
        user=UserResponse(
            id=new_user.id,
            email=new_user.email,
            createdAt=new_user.created_at,
        ),
        token=token,
        message="Registration successful",
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
)
def login(
    data: UserLoginSchema,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token({"id": user.id, "email": user.email})
    set_auth_cookie(response, token, request)

    return AuthResponse(
        user=UserResponse(
            id=user.id,
            email=user.email,
            createdAt=user.created_at,
        ),
        token=token,
        message="Login successful",
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
)
def logout(
    request: Request,
    response: Response,
):
    clear_auth_cookie(response, request)
    return MessageResponse(message="Logged out successfully")


@router.get(
    "/me",
    status_code=status.HTTP_200_OK,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return {
        "user": UserResponse(
            id=current_user.id,
            email=current_user.email,
            createdAt=current_user.created_at,
        )
    }
