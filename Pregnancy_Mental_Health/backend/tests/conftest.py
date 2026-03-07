"""
Test configuration and fixtures for backend tests
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.database import get_db
from app import models
from unittest.mock import AsyncMock

# Use SQLite for tests (no PostgreSQL needed)
# Use in-memory with check_same_thread=False for test isolation
SQLALCHEMY_TEST_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_TEST_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool  # Keep single connection for in-memory DB
)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test"""
    models.Base.metadata.create_all(bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        models.Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    """Create a test client with database override and disabled rate limiting"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    # Disable rate limiting for tests
    from app.rate_limiter import rate_limiter
    rate_limiter.check_rate_limit = AsyncMock()
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
