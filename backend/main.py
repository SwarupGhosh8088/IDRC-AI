
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import init_db
from backend.routes.incidents import router as incidents_router
from backend.routes.incidents import router as incidents_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="SevaCommand AI",
    description="AI-assisted disaster response coordination",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(incidents_router)


@app.get("/")
def root():
    return {"message": "SevaCommand AI backend is running", "status": "ok"}


@app.get("/api/health")
def health():
    return {
        "success": True,
        "service": "SevaCommand AI",
        "status": "healthy",
    }
