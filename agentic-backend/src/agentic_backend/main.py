from fastapi import FastAPI
from contextlib import asynccontextmanager
import asyncio
from .config import settings
from .api.ws_routes import router as ws_router
from .api.user_routes import router as user_router
from .models.db_models import init_db
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("Database initialised — ready")
    yield
    print("Shutting down gracefully...")
    tasks = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]
    for task in tasks:
        task.cancel()
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)
    print("Shutdown complete")

def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)
    # app.include_router(api_router, prefix="/v1")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins
        allow_credentials=True,
        allow_methods=["*"],  # Allow all HTTP methods
        allow_headers=["*"],  # Allow all headers
    )
    app.include_router(ws_router)  # WebSocket routes don't need prefix
    app.include_router(user_router)
    return app

app = create_app()