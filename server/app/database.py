from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import DATABASE_URL

is_sqlite = DATABASE_URL.startswith("sqlite")

connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def run_migrations():
    """Ensure existing SQLite/Postgres tables have the latest columns without data loss."""
    try:
        with engine.connect() as conn:
            inspector = inspect(engine)
            if "tasks" in inspector.get_table_names():
                columns = [col["name"] for col in inspector.get_columns("tasks")]
                if "priority" not in columns:
                    conn.execute(text("ALTER TABLE tasks ADD COLUMN priority VARCHAR(20) DEFAULT 'medium' NOT NULL"))
                if "due_date" not in columns:
                    conn.execute(text("ALTER TABLE tasks ADD COLUMN due_date DATETIME"))
                if "tag" not in columns:
                    conn.execute(text("ALTER TABLE tasks ADD COLUMN tag VARCHAR(50)"))
                conn.commit()
    except Exception as e:
        print(f"Migration note: {e}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
