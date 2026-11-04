from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "ForenScan"
    API_V1_STR: str = "/api/v1"
    
    # Storage settings
    STORAGE_DIR: str = str(BASE_DIR / "storage")
    EVIDENCE_DIR: str = str(BASE_DIR / "storage" / "evidence")
    CANDIDATES_DIR: str = str(BASE_DIR / "storage" / "candidates")
    MANIFESTS_DIR: str = str(BASE_DIR / "storage" / "manifests")
    FINDINGS_DIR: str = str(BASE_DIR / "storage" / "findings")
    REPORTS_DIR: str = str(BASE_DIR / "storage" / "reports")
    
    # Upload limits (Default: 50 MB)
    MAX_UPLOAD_SIZE_BYTES: int = 50 * 1024 * 1024
    
    # Block hashing settings (Default: 4 KiB)
    BLOCK_SIZE_BYTES: int = 4096
    
    # Database settings
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/storage/forenscan.db"
    
    # MongoDB settings
    MONGODB_URL: str = "mongodb://127.0.0.1:27017"
    MONGODB_DB_NAME: str = "forensight"
    JWT_SECRET: str = "forensight-forensic-secret-key-2026-audit"

    # Blockchain settings
    BLOCKCHAIN_RPC_URL: str = "http://127.0.0.1:8545"
    CONTRACT_ADDRESS_FILE: str = str(BASE_DIR / "blockchain" / "deployed" / "contract-address.json")
    FALLBACK_TO_DB_ANCHOR: bool = True
    
    # Watchdog settings (seconds)
    WATCHDOG_INTERVAL_SECONDS: int = 30
    WATCHDOG_ENABLED: bool = True

    model_config = {
        "env_file": ".env",
        "extra": "allow"
    }

settings = Settings()

# Ensure directories exist
for path in [
    settings.STORAGE_DIR,
    settings.EVIDENCE_DIR,
    settings.CANDIDATES_DIR,
    settings.MANIFESTS_DIR,
    settings.FINDINGS_DIR,
    settings.REPORTS_DIR
]:
    os.makedirs(path, exist_ok=True)
