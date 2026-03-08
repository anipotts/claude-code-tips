# photon

python 3.12 REST API. fastapi + sqlalchemy + alembic. serves the photon mobile app backend.

## structure

- `app/` -- main application package
- `app/api/` -- route handlers, grouped by domain (users, photos, albums)
- `app/models/` -- sqlalchemy ORM models
- `app/schemas/` -- pydantic request/response schemas
- `app/services/` -- business logic, one service per domain
- `app/core/` -- config, security, database session, dependencies
- `app/workers/` -- celery tasks (image processing, email)
- `migrations/` -- alembic migration files
- `tests/` -- mirrors app/ structure
- `scripts/` -- dev helpers, data migration scripts

## commands

- `uv run fastapi dev` -- start dev server on :8000 with reload
- `uv run pytest` -- run all tests
- `uv run pytest tests/api/test_users.py -k test_create` -- single test
- `uv run pytest --cov=app --cov-report=term-missing` -- with coverage
- `uv run alembic upgrade head` -- run pending migrations
- `uv run alembic revision --autogenerate -m "add photos table"` -- create migration
- `uv run alembic downgrade -1` -- rollback last migration
- `uv run mypy app/` -- type checking
- `uv run ruff check app/` -- linting
- `uv run ruff format app/` -- formatting

## env setup

- python 3.12+ required
- uses uv for package management. `uv sync` to install
- copy `.env.example` to `.env` for local dev
- postgres required: `docker compose up -d postgres redis`
- DATABASE_URL format: `postgresql+asyncpg://photon:photon@localhost:5432/photon`

## conventions

- async everywhere -- all route handlers, all db queries, all service methods
- one model per file in `app/models/`, registered in `app/models/__init__.py`
- pydantic schemas are separate from ORM models. never return ORM models directly
- dependency injection via fastapi `Depends()` -- db sessions, current user, etc.
- services raise `HTTPException` only at the API layer, return `None` or raise domain errors internally
- all queries go through repository pattern in `app/services/`, never raw sql in route handlers
- use `Annotated[str, Field(min_length=1)]` for required string fields, not bare `str`

## testing patterns

- fixtures in `tests/conftest.py`: `db_session`, `client`, `auth_headers`, `sample_user`
- use `httpx.AsyncClient` with `app` for integration tests
- factory functions in `tests/factories.py` for test data
- each test file gets a clean db transaction that rolls back after
- dont mock the database -- use the real test db, its fast enough

## common mistakes

- dont forget `async` -- every route handler and service must be async
- alembic autogenerate misses some changes. always review the generated migration
- dont put business logic in route handlers. routes are thin: validate -> service -> respond
- pydantic v2 syntax: `model_config = ConfigDict(...)` not inner `class Config`
- import models in `migrations/env.py` or alembic wont detect them

@docs/api-conventions.md
@docs/deployment.md
