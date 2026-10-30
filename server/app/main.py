from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.database import engine, Base
from app.config import CLIENT_URL
from app.routers.auth import router as auth_router
from app.routers.tasks import router as tasks_router

# Create SQLite/PostgreSQL database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Fluxen API",
    description="Fluxen Task Management REST API Server",
    version="1.0.0",
)

# Configure CORS
origins = [url.strip() for url in CLIENT_URL.split(",") if url.strip()]
if not origins:
    origins = ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?:\/\/.*$",  # Allow direct IP / domain cross-instance requests
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Standardized error responses to match frontend format
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    first_error = exc.errors()[0]
    error_msg = first_error.get("msg", "Validation error")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"error": error_msg},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(_request: Request, exc: Exception):
    print(f"Internal Server Error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "An unexpected internal error occurred"},
    )


# Health checks
@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": "fluxen-api"}


@app.get("/api/health", tags=["health"])
def api_health():
    return {"status": "ok", "service": "fluxen-api"}


# Mount routers
app.include_router(auth_router)
app.include_router(tasks_router)
