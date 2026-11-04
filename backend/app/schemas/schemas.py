from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Case Schemas ---
class CaseBase(BaseModel):
    title: str
    description: Optional[str] = None
    investigator: Optional[str] = "Forensic Analyst"
    priority: Optional[str] = "MEDIUM"
    tags: Optional[List[str]] = Field(default_factory=list)

class CaseCreate(CaseBase):
    id: Optional[str] = None
    case_number: Optional[str] = None

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    investigator: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None

class CaseResponse(BaseModel):
    id: str
    caseNumber: Optional[str] = None
    title: str
    description: Optional[str] = None
    investigator: Optional[str] = "Forensic Analyst"
    investigatorName: Optional[str] = None
    priority: Optional[str] = "MEDIUM"
    status: str = "ACTIVE"
    tags: List[str] = Field(default_factory=list)
    created_at: Optional[Any] = None
    createdAt: Optional[Any] = None
    updatedAt: Optional[Any] = None
    closedAt: Optional[Any] = None
    evidenceCount: Optional[int] = 0
    findingsCount: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True, extra="allow")


# --- Finding Schemas ---
class FindingResponse(BaseModel):
    id: str
    evidence_id: Optional[str] = None
    evidenceId: Optional[str] = None
    caseId: Optional[str] = None
    analysisJobId: Optional[str] = None
    check_category: Optional[str] = None
    category: Optional[str] = None
    severity: str
    title: str
    description: str
    supporting_observations: Optional[Dict[str, Any]] = None
    supportingArtifactReferences: Optional[List[Any]] = None
    measurements: Optional[Dict[str, Any]] = None
    confidence: Optional[str] = "HIGH"
    recommendation: Optional[str] = None
    is_reviewed: Optional[bool] = False
    isReviewed: Optional[bool] = False
    reviewed_by: Optional[str] = None
    reviewedBy: Optional[str] = None
    review_notes: Optional[str] = None
    reviewNotes: Optional[str] = None
    created_at: Optional[Any] = None
    createdAt: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True, extra="allow")

class FindingReviewUpdate(BaseModel):
    is_reviewed: bool = True
    reviewed_by: str
    review_notes: Optional[str] = None


# --- Custody Event Schemas ---
class CustodyEventResponse(BaseModel):
    id: str
    evidence_id: Optional[str] = None
    evidenceId: Optional[str] = None
    caseId: Optional[str] = None
    timestamp: Optional[Any] = None
    occurredAt: Optional[Any] = None
    recordedAt: Optional[Any] = None
    event_type: Optional[str] = None
    eventType: Optional[str] = None
    actor: Optional[str] = None
    actorName: Optional[str] = None
    fromCustodian: Optional[str] = None
    toCustodian: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    previous_event_id: Optional[str] = None
    previousEventHash: Optional[str] = None
    event_record_hash: Optional[str] = None
    eventHash: Optional[str] = None
    anchored_on_chain: Optional[bool] = False
    anchoredOnChain: Optional[bool] = False
    blockchain_tx_hash: Optional[str] = None
    blockchainTxHash: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, extra="allow")

class CustodyTransferRequest(BaseModel):
    evidenceId: str
    caseId: Optional[str] = None
    fromCustodian: str
    toCustodian: str
    reason: str
    actor: Optional[str] = "Investigator"
    notes: Optional[str] = None

class ChainVerificationResponse(BaseModel):
    evidenceId: str
    isChainValid: bool
    totalEvents: int
    verifiedLinks: int
    brokenAtEventId: Optional[str] = None
    message: str
    events: List[CustodyEventResponse] = []


# --- Verification Schemas ---
class VerificationResponse(BaseModel):
    id: str
    evidence_id: Optional[str] = None
    evidenceId: Optional[str] = None
    candidate_filename: Optional[str] = None
    candidateFilename: Optional[str] = None
    candidate_size_bytes: Optional[int] = 0
    candidateFileSize: Optional[int] = 0
    candidate_sha256: Optional[str] = None
    candidateSha256: Optional[str] = None
    candidate_md5: Optional[str] = None
    candidate_sha1: Optional[str] = None
    candidate_merkle_root: Optional[str] = None
    candidateMerkleRoot: Optional[str] = None
    exact_match: Optional[bool] = False
    exactMatch: Optional[bool] = False
    total_blocks_compared: Optional[int] = 0
    totalBlocksCompared: Optional[int] = 0
    matching_blocks_count: Optional[int] = 0
    matchingBlocksCount: Optional[int] = 0
    matching_blocks_percentage: Optional[float] = 0.0
    matchingPercentage: Optional[float] = 0.0
    differing_blocks_count: Optional[int] = 0
    differingBlocksCount: Optional[int] = 0
    differing_blocks_percentage: Optional[float] = 0.0
    differingPercentage: Optional[float] = 0.0
    byte_ranges_diff: Optional[List[Dict[str, Any]]] = None
    byteRangesDiff: Optional[List[Dict[str, Any]]] = None
    perceptual_hash_distance: Optional[int] = None
    visual_similarity_percentage: Optional[float] = None
    tamper_heatmap_path: Optional[str] = None
    tamperHeatmapUrl: Optional[str] = None
    ela_result_path: Optional[str] = None
    verified_at: Optional[Any] = None
    verifiedAt: Optional[Any] = None
    verifier: Optional[str] = "Forensic Analyst"
    status: Optional[str] = "COMPLETED"

    model_config = ConfigDict(from_attributes=True, extra="allow")


# --- Evidence Schemas ---
class EvidenceResponse(BaseModel):
    id: str
    case_id: Optional[str] = None
    caseId: Optional[str] = None
    evidenceNumber: Optional[str] = None
    original_filename: Optional[str] = None
    originalFilename: Optional[str] = None
    file_size_bytes: Optional[int] = 0
    fileSize: Optional[int] = 0
    claimed_extension: Optional[str] = None
    detected_mime_type: Optional[str] = None
    detectedFileType: Optional[str] = None
    evidenceType: Optional[str] = "DOCUMENT"
    sha256: str
    md5: Optional[str] = None
    sha1: Optional[str] = None
    block_size_bytes: Optional[int] = 4096
    total_blocks: Optional[int] = 0
    merkle_root: Optional[str] = None
    merkleRoot: Optional[str] = None
    storageReference: Optional[str] = None
    acquired_at: Optional[Any] = None
    acquisitionTimestamp: Optional[Any] = None
    acquisition_operator: Optional[str] = "Forensic Analyst"
    acquiredBy: Optional[str] = "Forensic Analyst"
    acquisition_notes: Optional[str] = None
    source_device: Optional[str] = None
    acquisitionMetadata: Optional[Dict[str, Any]] = None
    analysis_status: Optional[str] = "COMPLETED"
    anchoring_status: Optional[str] = "ANCHORED_CHAIN"
    blockchain_tx_hash: Optional[str] = None
    blockchain_block_number: Optional[int] = None
    analysis_report_hash: Optional[str] = None
    integrity_status: Optional[str] = "VERIFIED"
    verificationStatus: Optional[str] = "VERIFIED"
    last_verified_at: Optional[Any] = None
    lastVerifiedAt: Optional[Any] = None
    createdAt: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True, extra="allow")

class EvidenceDetailResponse(EvidenceResponse):
    findings: List[FindingResponse] = []
    custody_events: List[CustodyEventResponse] = []
    verifications: List[VerificationResponse] = []


# --- Analysis Jobs Schemas ---
class AnalysisJobCreate(BaseModel):
    caseId: str
    evidenceId: str
    analysisType: str = "FULL_SUITE"
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict)

class AnalysisJobResponse(BaseModel):
    id: str
    caseId: str
    evidenceId: str
    analysisType: str
    status: str
    toolName: str
    toolVersion: str
    parameters: Optional[Dict[str, Any]] = None
    startedAt: Optional[Any] = None
    completedAt: Optional[Any] = None
    errorSummary: Optional[str] = None
    findingsCount: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True, extra="allow")


# --- Watchdog Schemas ---
class WatchdogAuditResponse(BaseModel):
    id: str
    run_timestamp: Optional[Any] = None
    runTimestamp: Optional[Any] = None
    total_checked: Optional[int] = 0
    totalChecked: Optional[int] = 0
    total_passed: Optional[int] = 0
    totalPassed: Optional[int] = 0
    total_mismatches: Optional[int] = 0
    totalMismatches: Optional[int] = 0
    total_missing: Optional[int] = 0
    totalMissing: Optional[int] = 0
    details: Optional[Any] = None
    status: str

    model_config = ConfigDict(from_attributes=True, extra="allow")


# --- Database Diagnostic Schemas ---
class ExplainRequest(BaseModel):
    collection: str = "evidence"
    filter: Dict[str, Any] = Field(default_factory=dict)
    sort: Optional[str] = None

class AggregateDemoRequest(BaseModel):
    pipelineName: str = "evidence_type_summary"
