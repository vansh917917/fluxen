import os
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", "5000"))
NODE_ENV = os.getenv("NODE_ENV", "development")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fluxen.db")
JWT_SECRET = os.getenv("JWT_SECRET", "fluxen_secret_key_change_in_production_12345")
CLIENT_URL = os.getenv("CLIENT_URL", "http://localhost:5173")
