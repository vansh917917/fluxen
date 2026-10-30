from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
import jwt
from fastapi import Request, Response, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.config import JWT_SECRET, NODE_ENV
from app.database import get_db
from app.models import User

ALGORITHM = "HS256"
COOKIE_NAME = "fluxen_token"
TOKEN_EXPIRE_DAYS = 7


def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(10)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)

    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)


def set_auth_cookie(response: Response, token: str, request: Request) -> None:
    is_production = NODE_ENV == "production"
    is_secure = is_production and (
        request.url.scheme == "https"
        or request.headers.get("x-forwarded-proto") == "https"
    )

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=True,
        samesite="none" if is_secure else "lax",
        secure=is_secure,
        path="/",
    )


def clear_auth_cookie(response: Response, request: Request) -> None:
    is_production = NODE_ENV == "production"
    is_secure = is_production and (
        request.url.scheme == "https"
        or request.headers.get("x-forwarded-proto") == "https"
    )

    response.delete_cookie(
        key=COOKIE_NAME,
        httponly=True,
        samesite="none" if is_secure else "lax",
        secure=is_secure,
        path="/",
    )


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    token: Optional[str] = None

    # Check explicit Authorization header first, then ambient cookie
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    elif COOKIE_NAME in request.cookies:
        token = request.cookies.get(COOKIE_NAME)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session",
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user
