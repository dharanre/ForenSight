from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Case(Base):
    __tablename__ = "cases"

    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    investigator = Column(String(128), default="Forensic Analyst")
    created_at = Column(DateTime, default=utcnow)
    status = Column(String(32), default="ACTIVE") # ACTIVE, ARCHIVED, CLOSED

    evidences = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")


class Evidence(Base):
    __tablename__ = "evidences"

    id = Column(String(64), primary_key=True, index=True) # EVD-XXXXXXXX
    case_id = Column(String(64), ForeignKey("cases.id"), nullable=False, index=True)
    
    original_filename = Column(String(255), nullable=False)
    storage_path = Column(String(512), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    claimed_extension = Column(String(32), nullable=False)
    detected_mime_type = Column(String(128), nullable=False)
    
    # Cryptographic hashes
    sha256 = Column(String(64), nullable=False, index=True)
    md5 = Column(String(32), nullable=False)
    sha1 = Column(String(40), nullable=False)
    
    # Merkle information
    block_size_bytes = Column(Integer, default=4096)
    total_blocks = Column(Integer, default=0)
    merkle_root = Column(String(64), nullable=True)
    manifest_path = Column(String(512), nullable=True)
    
    # Acquisition metadata
    acquired_at = Column(DateTime, default=utcnow)
    acquisition_operator = Column(String(128), default="System Operator")
    acquisition_notes = Column(Text, nullable=True)
    source_device = Column(String(255), nullable=True)
    
    # Analysis & Anchoring status
    analysis_status = Column(String(32), default="PENDING") # PENDING, IN_PROGRESS, COMPLETED, FAILED
    anchoring_status = Column(String(32), default="NOT_ANCHORED") # NOT_ANCHORED, ANCHORED_CHAIN, FALLBACK_DB, FAILED
    blockchain_tx_hash = Column(String(128), nullable=True)
    blockchain_block_number = Column(Integer, nullable=True)
    analysis_report_hash = Column(String(64), nullable=True)
    
    # Watchdog & Integrity Status
    integrity_status = Column(String(32), default="VERIFIED") # VERIFIED, MISMATCH_DETECTED, ERROR
    last_verified_at = Column(DateTime, default=utcnow)
    
    case = relationship("Case", back_populates="evidences")
    findings = relationship("ForensicFinding", back_populates="evidence", cascade="all, delete-orphan")
    verifications = relationship("VerificationRecord", back_populates="evidence", cascade="all, delete-orphan")
    custody_events = relationship("CustodyEvent", back_populates="evidence", cascade="all, delete-orphan")


class ForensicFinding(Base):
    __tablename__ = "forensic_findings"

    id = Column(String(64), primary_key=True, index=True)
    evidence_id = Column(String(64), ForeignKey("evidences.id"), nullable=False, index=True)
    
    check_category = Column(String(64), nullable=False) # ACQUISITION, FILE_IDENTITY, METADATA, MANIPULATION, TIMELINE
    severity = Column(String(32), nullable=False) # INFO, LOW, MEDIUM, HIGH, CRITICAL
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    supporting_observations = Column(JSON, nullable=True)
    measurements = Column(JSON, nullable=True)
    confidence = Column(String(32), default="HIGH")
    recommendation = Column(Text, nullable=True)
    
    is_reviewed = Column(Boolean, default=False)
    reviewed_by = Column(String(128), nullable=True)
    review_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    evidence = relationship("Evidence", back_populates="findings")


class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id = Column(String(64), primary_key=True, index=True) # VRF-XXXXXXXX
    evidence_id = Column(String(64), ForeignKey("evidences.id"), nullable=False, index=True)
    
    candidate_filename = Column(String(255), nullable=False)
    candidate_storage_path = Column(String(512), nullable=False)
    candidate_size_bytes = Column(Integer, nullable=False)
    
    candidate_sha256 = Column(String(64), nullable=False)
    candidate_md5 = Column(String(32), nullable=False)
    candidate_sha1 = Column(String(40), nullable=False)
    candidate_merkle_root = Column(String(64), nullable=True)
    
    # Comparison metrics
    exact_match = Column(Boolean, default=False)
    total_blocks_compared = Column(Integer, default=0)
    matching_blocks_count = Column(Integer, default=0)
    matching_blocks_percentage = Column(Float, default=0.0)
    differing_blocks_count = Column(Integer, default=0)
    differing_blocks_percentage = Column(Float, default=0.0)
    
    byte_ranges_diff = Column(JSON, nullable=True) # List of {"start": X, "end": Y, "length": Z}
    perceptual_hash_distance = Column(Integer, nullable=True)
    visual_similarity_percentage = Column(Float, nullable=True)
    
    tamper_heatmap_path = Column(String(512), nullable=True)
    ela_result_path = Column(String(512), nullable=True)
    
    verified_at = Column(DateTime, default=utcnow)
    verifier = Column(String(128), default="Forensic Analyst")
    status = Column(String(32), default="COMPLETED") # COMPLETED, FAILED

    evidence = relationship("Evidence", back_populates="verifications")


class CustodyEvent(Base):
    __tablename__ = "custody_events"

    id = Column(String(64), primary_key=True, index=True) # CUS-XXXXXXXX
    evidence_id = Column(String(64), ForeignKey("evidences.id"), nullable=False, index=True)
    
    timestamp = Column(DateTime, default=utcnow)
    event_type = Column(String(64), nullable=False) 
    # EVIDENCE_ACQUIRED, ANALYSIS_STARTED, ANALYSIS_COMPLETED, EVIDENCE_ANCHORED,
    # VERIFICATION_STARTED, VERIFICATION_COMPLETED, REPORT_GENERATED, 
    # INTEGRITY_MISMATCH_DETECTED, WATCHDOG_ALERT, FINDING_REVIEWED
    
    actor = Column(String(128), nullable=False)
    notes = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)
    
    # Cryptographic event chain
    previous_event_id = Column(String(64), nullable=True)
    event_record_hash = Column(String(64), nullable=False) # SHA-256 hash of canonical event data
    anchored_on_chain = Column(Boolean, default=False)
    blockchain_tx_hash = Column(String(128), nullable=True)

    evidence = relationship("Evidence", back_populates="custody_events")


class WatchdogAudit(Base):
    __tablename__ = "watchdog_audits"

    id = Column(String(64), primary_key=True, index=True)
    run_timestamp = Column(DateTime, default=utcnow)
    total_checked = Column(Integer, default=0)
    total_passed = Column(Integer, default=0)
    total_mismatches = Column(Integer, default=0)
    total_missing = Column(Integer, default=0)
    details = Column(JSON, nullable=True)
    status = Column(String(32), default="PASSED") # PASSED, ANOMALIES_DETECTED, ERROR
