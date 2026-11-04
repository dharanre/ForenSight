from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.core.database import engine, Base
from app.api.endpoints import router as api_router
from app.services.watchdog import watchdog_service

# Initialize database schema
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start watchdog background loop if enabled
    if settings.WATCHDOG_ENABLED:
        await watchdog_service.start()
    yield
    # Shutdown: Stop watchdog cleanly
    await watchdog_service.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="ForenScan Digital Forensics & ForenChain Tamper-Localization REST API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount static findings directory for visual previews (heatmaps, ELA images)
if os.path.exists(settings.FINDINGS_DIR):
    app.mount("/static/findings", StaticFiles(directory=settings.FINDINGS_DIR), name="findings")
if os.path.exists(settings.EVIDENCE_DIR):
    app.mount("/static/evidence", StaticFiles(directory=settings.EVIDENCE_DIR), name="evidence")

@app.get("/")
def root():
    return {
        "project": "ForenScan",
        "description": "Automated forensic analysis and tamper localization for digital evidence.",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
