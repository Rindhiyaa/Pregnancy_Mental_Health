from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlmodel import SQLModel, create_engine, Session

from .config import get_settings

settings = get_settings()
engine = create_engine(settings.database_url, echo=False)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> AsyncGenerator[Session, None]:
    with Session(engine) as session:
        yield session


@asynccontextmanager
async def lifespan(app):
    init_db()
    yield


