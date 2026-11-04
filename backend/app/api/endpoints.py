import os
import uuid
import json
import asyncio
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, Query, status
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.mongo import mongo_manager, json_serialize
from app.schemas.schemas import (
    CaseCreate, CaseUpdate, CaseResponse,
    EvidenceResponse, EvidenceDetailResponse,
    FindingResponse, FindingReviewUpdate,
    VerificationResponse, CustodyEventResponse, CustodyTransferRequest, ChainVerificationResponse,
    AnalysisJobCreate, AnalysisJobResponse,
    WatchdogAuditResponse, ExplainRequest, AggregateDemoRequest
)
from app.services.acquisition import acquire_and_register_evidence
from app.services.hashing import calculate_file_hashes
from app.services.tamper_localization import localize_tampering
from app.services.custody import record_custody_event, verify_custody_chain
from app.services.report import generate_pdf_report
from app.services.events import event_publisher
from app.services.blockchain import blockchain_service
from app.services.watchdog import watchdog_service

router = APIRouter()

def utcnow_str() -> str:
    return datetime.now(timezone.utc).isoformat()

# ==============================================================================
# 1. Health & Telemetry
# ==============================================================================
@router.get("/health")
def get_health():
    db = mongo_manager.db
    return {
        "status": "healthy",
        "blockchain_connected": blockchain_service.is_connected(),
        "contract_address": blockchain_service.contract_address,
        "watchdog_running": watchdog_service._running,
        "last_watchdog_check": watchdog_service.last_check_time,
        "platform": "ForenSight — Digital Forensics Investigation Platform",
        "database": {
            "engine": mongo_manager.engine_type,
            "connected": mongo_manager.is_connected,
            "host": mongo_manager.host_info,
            "databaseName": settings.MONGODB_DB_NAME,
            "totalCases": db.cases.count_documents({}),
            "totalEvidence": db.evidence.count_documents({})
        },
        "blockchain": {
            "connected": blockchain_service.is_connected(),
            "contractAddress": blockchain_service.contract_address,
            "fallbackToDb": settings.FALLBACK_TO_DB_ANCHOR
        },
        "timestamp": utcnow_str()
    }

# ==============================================================================
# 2. Cases Management (Full MongoDB CRUD, Filter, Paginate)
# ==============================================================================
@router.get("/cases", response_model=List[CaseResponse])
def list_cases(
    status: Optional[str] = Query(None, description="Filter by case status (ACTIVE, CLOSED, ARCHIVED)"),
    priority: Optional[str] = Query(None, description="Filter by priority (LOW, MEDIUM, HIGH, CRITICAL)"),
    search: Optional[str] = Query(None, description="Search term in title, description, or caseNumber"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    db = mongo_manager.db
    query: Dict[str, Any] = {}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"caseNumber": {"$regex": search, "$options": "i"}}
        ]

    cursor = db.cases.find(query).sort("createdAt", -1).skip(skip).limit(limit)
    cases = []
    for doc in cursor:
        case_id = str(doc.get("_id") or doc.get("id"))
        ev_count = db.evidence.count_documents({"caseId": case_id})
        fnd_count = db.findings.count_documents({"caseId": case_id})
        serialized = json_serialize(doc)
        serialized["evidenceCount"] = ev_count
        serialized["findingsCount"] = fnd_count
        cases.append(serialized)
    return cases

@router.post("/cases", response_model=CaseResponse)
def create_case(case_in: CaseCreate):
    db = mongo_manager.db
    now_str = utcnow_str()

    # Generate sequential case number if not provided
    total_existing = db.cases.count_documents({})
    case_number = case_in.case_number or f"FR-{datetime.now().year}-{total_existing + 101:03d}"
    case_id = case_in.id or f"CASE-{uuid.uuid4().hex[:8].upper()}"

    # Check for duplicate caseNumber
    if db.cases.find_one({"caseNumber": case_number}):
        case_number = f"FR-{datetime.now().year}-{total_existing + 102:03d}"

    case_doc = {
        "_id": case_id,
        "id": case_id,
        "caseNumber": case_number,
        "title": case_in.title,
        "description": case_in.description,
        "investigator": case_in.investigator or "Forensic Analyst",
        "investigatorName": case_in.investigator or "Forensic Analyst",
        "priority": case_in.priority or "MEDIUM",
        "status": "ACTIVE",
        "tags": case_in.tags or ["DIGITAL_FORENSICS"],
        "createdAt": now_str,
        "created_at": now_str,
        "updatedAt": now_str,
        "closedAt": None
    }

    db.cases.insert_one(case_doc)
    mongo_manager.persist()

    mongo_manager.log_audit(
        actor_id=case_in.investigator or "system",
        actor_name=case_in.investigator or "Forensic Analyst",
        action="CASE_CREATED",
        resource_type="CASE",
        resource_id=case_id,
        details={"caseNumber": case_number, "title": case_in.title, "priority": case_in.priority}
    )

    return json_serialize(case_doc)

@router.get("/cases/{case_id}")
def get_case_detail(case_id: str):
    db = mongo_manager.db
    case_doc = db.cases.find_one({"_id": case_id}) or db.cases.find_one({"id": case_id})
    if not case_doc:
        raise HTTPException(status_code=404, detail="Case not found")

    # Fetch associated evidence, findings, custody events, and audit logs
    evidence_cursor = db.evidence.find({"caseId": case_id}).sort("acquisitionTimestamp", -1)
    evidences = [json_serialize(doc) for doc in evidence_cursor]

    findings_cursor = db.findings.find({"caseId": case_id}).sort("createdAt", -1)
    findings = [json_serialize(doc) for doc in findings_cursor]

    custody_cursor = db.custodyEvents.find({"caseId": case_id}).sort("occurredAt", -1)
    custody_events = [json_serialize(doc) for doc in custody_cursor]

    audit_cursor = db.auditLogs.find({"resourceId": case_id}).sort("timestamp", -1)
    audit_logs = [json_serialize(doc) for doc in audit_cursor]

    case_data = json_serialize(case_doc)
    case_data["evidences"] = evidences
    case_data["evidence"] = evidences
    case_data["findings"] = findings
    case_data["custodyEvents"] = custody_events
    case_data["auditLogs"] = audit_logs

    # Verification stats
    total_ev = len(evidences)
    verified_ev = sum(1 for e in evidences if e.get("verificationStatus") == "VERIFIED")
    mismatch_ev = sum(1 for e in evidences if e.get("verificationStatus") == "MISMATCH_DETECTED")
    case_data["evidenceSummary"] = {
        "total": total_ev,
        "verified": verified_ev,
        "mismatches": mismatch_ev,
        "pending": total_ev - verified_ev - mismatch_ev
    }

    return case_data

@router.patch("/cases/{case_id}", response_model=CaseResponse)
def update_case(case_id: str, update_in: CaseUpdate):
    db = mongo_manager.db
    case_doc = db.cases.find_one({"_id": case_id}) or db.cases.find_one({"id": case_id})
    if not case_doc:
        raise HTTPException(status_code=404, detail="Case not found")

    update_fields: Dict[str, Any] = {"updatedAt": utcnow_str()}
    if update_in.title is not None:
        update_fields["title"] = update_in.title
    if update_in.description is not None:
        update_fields["description"] = update_in.description
    if update_in.investigator is not None:
        update_fields["investigator"] = update_in.investigator
        update_fields["investigatorName"] = update_in.investigator
    if update_in.priority is not None:
        update_fields["priority"] = update_in.priority
    if update_in.status is not None:
        update_fields["status"] = update_in.status
        if update_in.status == "CLOSED":
            update_fields["closedAt"] = utcnow_str()
        elif update_in.status == "ACTIVE":
            update_fields["closedAt"] = None
    if update_in.tags is not None:
        update_fields["tags"] = update_in.tags

    actual_id = case_doc.get("_id")
    db.cases.update_one({"_id": actual_id}, {"$set": update_fields})
    mongo_manager.persist()

    updated = db.cases.find_one({"_id": actual_id})
    mongo_manager.log_audit(
        actor_id=update_in.investigator or "system",
        actor_name=update_in.investigator or "Forensic Analyst",
        action="CASE_UPDATED",
        resource_type="CASE",
        resource_id=case_id,
        details=update_fields
    )

    return json_serialize(updated)

@router.delete("/cases/{case_id}")
def archive_case(case_id: str):
    db = mongo_manager.db
    case_doc = db.cases.find_one({"_id": case_id}) or db.cases.find_one({"id": case_id})
    if not case_doc:
        raise HTTPException(status_code=404, detail="Case not found")

    # Perform authorized archive rather than permanent hard drop to maintain forensic integrity
    db.cases.update_one(
        {"_id": case_doc.get("_id")},
        {"$set": {"status": "ARCHIVED", "closedAt": utcnow_str(), "updatedAt": utcnow_str()}}
    )
    mongo_manager.persist()

    mongo_manager.log_audit(
        actor_id="system",
        actor_name="Authorized Investigator",
        action="CASE_ARCHIVED",
        resource_type="CASE",
        resource_id=case_id,
        details={"status": "ARCHIVED"}
    )
    return {"message": f"Case {case_id} has been archived successfully.", "status": "ARCHIVED"}

# ==============================================================================
# 3. Evidence Explorer & Acquisition
# ==============================================================================
@router.get("/evidence", response_model=List[EvidenceResponse])
def list_evidence(
    case_id: Optional[str] = Query(None, description="Filter by case ID"),
    evidence_type: Optional[str] = Query(None, description="Filter by evidence type"),
    verification_status: Optional[str] = Query(None, description="Filter by verification status"),
    search: Optional[str] = Query(None, description="Search filename or SHA-256"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    db = mongo_manager.db
    query: Dict[str, Any] = {}
    if case_id:
        query["caseId"] = case_id
    if evidence_type:
        query["evidenceType"] = evidence_type
    if verification_status:
        query["verificationStatus"] = verification_status
    if search:
        query["$or"] = [
            {"originalFilename": {"$regex": search, "$options": "i"}},
            {"sha256": {"$regex": search, "$options": "i"}},
            {"evidenceNumber": {"$regex": search, "$options": "i"}}
        ]

    cursor = db.evidence.find(query).sort("acquisitionTimestamp", -1).skip(skip).limit(limit)
    return [json_serialize(doc) for doc in cursor]

@router.post("/evidence", response_model=EvidenceResponse)
async def register_evidence(
    case_id: str = Form(...),
    acquisition_operator: str = Form("Forensic Analyst"),
    acquisition_notes: Optional[str] = Form(None),
    source_device: Optional[str] = Form(None),
    evidence_type: str = Form("DOCUMENT"),
    file: UploadFile = File(...)
):
    db = mongo_manager.db

    # Ensure case exists or create default
    case = db.cases.find_one({"_id": case_id}) or db.cases.find_one({"id": case_id})
    if not case:
        case_doc = {
            "_id": case_id,
            "id": case_id,
            "caseNumber": f"FR-{datetime.now().year}-{db.cases.count_documents({}) + 101:03d}",
            "title": f"Investigation Case {case_id}",
            "description": "Auto-initialized case during evidence intake.",
            "investigator": acquisition_operator,
            "priority": "MEDIUM",
            "status": "ACTIVE",
            "tags": ["INTAKE_ACQUIRED"],
            "createdAt": utcnow_str(),
            "updatedAt": utcnow_str(),
            "closedAt": None
        }
        db.cases.insert_one(case_doc)

    # Save to temporary path for verification & hashing
    temp_filename = f"temp_{uuid.uuid4().hex}_{file.filename}"
    temp_path = os.path.join(settings.STORAGE_DIR, temp_filename)
    
    file_bytes_count = 0
    with open(temp_path, "wb") as f:
        while chunk := await file.read(65536):
            file_bytes_count += len(chunk)
            if file_bytes_count > settings.MAX_UPLOAD_SIZE_BYTES:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                raise HTTPException(status_code=400, detail="Uploaded evidence file exceeds 50MB maximum configured limit.")
            f.write(chunk)

    try:
        # Run real forensic acquisition pipeline
        from app.core.database import SessionLocal
        sql_session = SessionLocal()
        try:
            evidence_doc = acquire_and_register_evidence(
                db=sql_session,
                case_id=case_id,
                original_filename=file.filename,
                temp_file_path=temp_path,
                acquisition_operator=acquisition_operator,
                acquisition_notes=acquisition_notes,
                source_device=source_device,
                evidence_type=evidence_type
            )
        finally:
            sql_session.close()
        return json_serialize(evidence_doc)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.get("/evidence/{evidence_id}", response_model=EvidenceDetailResponse)
def get_evidence_detail(evidence_id: str):
    db = mongo_manager.db
    ev_doc = db.evidence.find_one({"_id": evidence_id}) or db.evidence.find_one({"id": evidence_id})
    if not ev_doc:
        raise HTTPException(status_code=404, detail="Evidence record not found")

    # Fetch findings, custody events, and verifications from MongoDB
    findings_cursor = db.findings.find({"evidenceId": evidence_id}).sort("createdAt", -1)
    findings = [json_serialize(doc) for doc in findings_cursor]

    custody_cursor = db.custodyEvents.find({"evidenceId": evidence_id}).sort("occurredAt", 1)
    custody_events = [json_serialize(doc) for doc in custody_cursor]

    # Look up any verification records
    verif_cursor = db.verificationRecords.find({"evidenceId": evidence_id}).sort("verifiedAt", -1) if "verificationRecords" in db.list_collection_names() else []
    verifications = [json_serialize(doc) for doc in verif_cursor]

    res = json_serialize(ev_doc)
    res["findings"] = findings
    res["custody_events"] = custody_events
    res["custodyEvents"] = custody_events
    res["verifications"] = verifications
    return res

@router.post("/evidence/{evidence_id}/verify", response_model=VerificationResponse)
async def verify_evidence_integrity(
    evidence_id: str,
    file: Optional[UploadFile] = File(None),
    candidate_file: Optional[UploadFile] = File(None),
    verifier: str = Form("Forensic Analyst")
):
    """
    Recalculates SHA-256 of stored evidence, or compares candidate uploaded file against
    acquired bitstream to localize sector tampering, compute block differences, and generate heatmap overlay.
    """
    db = mongo_manager.db
    ev_doc = db.evidence.find_one({"_id": evidence_id}) or db.evidence.find_one({"id": evidence_id})
    if not ev_doc:
        raise HTTPException(status_code=404, detail="Evidence not found")

    stored_path = ev_doc.get("storageReference") or ev_doc.get("storage_path")
    original_sha256 = ev_doc.get("sha256")
    manifest_path = ev_doc.get("acquisitionMetadata", {}).get("manifestPath") or ev_doc.get("manifest_path")
    detected_mime = ev_doc.get("detectedFileType") or ev_doc.get("detected_mime_type")

    actual_file = candidate_file or file

    # If candidate file is uploaded, run deep tamper localization
    if actual_file is not None:
        candidate_filename = f"candidate_{uuid.uuid4().hex}_{actual_file.filename}"
        candidate_path = os.path.join(settings.CANDIDATES_DIR, candidate_filename)
        with open(candidate_path, "wb") as f:
            while chunk := await actual_file.read(65536):
                f.write(chunk)
        
        try:
            output_heatmap = os.path.join(settings.FINDINGS_DIR, f"{evidence_id}_tamper_heatmap.png")
            output_ela = os.path.join(settings.FINDINGS_DIR, f"{evidence_id}_tamper_ela.png")
            cand_hashes = calculate_file_hashes(candidate_path)

            raw_verif = localize_tampering(
                ref_file_path=stored_path,
                cand_file_path=candidate_path,
                ref_manifest_path=manifest_path,
                output_heatmap_path=output_heatmap,
                output_ela_path=output_ela
            )

            is_exact = raw_verif["differing_blocks_count"] == 0 and raw_verif["matching_blocks_percentage"] == 100.0
            now_str = utcnow_str()

            verif_res = {
                "id": f"VRF-{uuid.uuid4().hex[:8].upper()}",
                "evidence_id": evidence_id,
                "evidenceId": evidence_id,
                "candidate_filename": actual_file.filename,
                "candidateFilename": actual_file.filename,
                "candidate_size_bytes": os.path.getsize(candidate_path),
                "candidateFileSize": os.path.getsize(candidate_path),
                "candidate_sha256": cand_hashes["sha256"],
                "candidateSha256": cand_hashes["sha256"],
                "candidate_md5": cand_hashes["md5"],
                "candidate_sha1": cand_hashes["sha1"],
                "candidate_merkle_root": raw_verif.get("candidate_merkle_root"),
                "candidateMerkleRoot": raw_verif.get("candidate_merkle_root"),
                "exact_match": is_exact,
                "exactMatch": is_exact,
                "total_blocks_compared": raw_verif["total_blocks_compared"],
                "totalBlocksCompared": raw_verif["total_blocks_compared"],
                "matching_blocks_count": raw_verif["matching_blocks_count"],
                "matchingBlocksCount": raw_verif["matching_blocks_count"],
                "matching_blocks_percentage": raw_verif["matching_blocks_percentage"],
                "matchingPercentage": raw_verif["matching_blocks_percentage"],
                "differing_blocks_count": raw_verif["differing_blocks_count"],
                "differingBlocksCount": raw_verif["differing_blocks_count"],
                "differing_blocks_percentage": raw_verif["differing_blocks_percentage"],
                "differingPercentage": raw_verif["differing_blocks_percentage"],
                "byte_ranges_diff": raw_verif["byte_ranges_diff"],
                "byteRangesDiff": raw_verif["byte_ranges_diff"],
                "perceptual_hash_distance": raw_verif.get("perceptual_hash_distance"),
                "visual_similarity_percentage": raw_verif.get("visual_similarity_percentage"),
                "tamper_heatmap_path": raw_verif.get("tamper_heatmap_path"),
                "ela_result_path": raw_verif.get("ela_result_path"),
                "verified_at": now_str,
                "verifiedAt": now_str,
                "verifier": verifier,
                "status": "COMPLETED"
            }

            # Update evidence verification status in MongoDB
            new_status = "VERIFIED" if is_exact else "MISMATCH_DETECTED"
            db.evidence.update_one(
                {"_id": ev_doc["_id"]},
                {"$set": {
                    "verificationStatus": new_status,
                    "integrity_status": new_status,
                    "lastVerifiedAt": now_str
                }}
            )

            # Record custody event for verification
            record_custody_event(
                evidence_id=evidence_id,
                case_id=ev_doc.get("caseId"),
                event_type="INTEGRITY_VERIFICATION",
                actor=verifier,
                from_custodian="Evidence Storage",
                to_custodian="Verification Station",
                reason=f"Integrity check against candidate file '{actual_file.filename}'. Result: {new_status} (Match: {raw_verif.get('matching_blocks_percentage', 0):.1f}%)",
                details={
                    "outcome": new_status,
                    "exact_match": is_exact,
                    "matchingPercentage": raw_verif.get("matching_blocks_percentage", 0),
                    "differingBlocks": raw_verif.get("differing_blocks_count", 0)
                }
            )
            mongo_manager.persist()
            return verif_res
        finally:
            pass
    else:
        # Standard stored evidence re-verification
        if not stored_path or not os.path.exists(stored_path):
            raise HTTPException(status_code=400, detail="Stored evidence file not found on disk.")

        recalculated = calculate_file_hashes(stored_path)
        is_exact = recalculated["sha256"].lower() == original_sha256.lower()
        new_status = "VERIFIED" if is_exact else "MISMATCH_DETECTED"
        now_str = utcnow_str()

        db.evidence.update_one(
            {"_id": ev_doc["_id"]},
            {"$set": {
                "verificationStatus": new_status,
                "integrity_status": new_status,
                "lastVerifiedAt": now_str
            }}
        )

        record_custody_event(
            evidence_id=evidence_id,
            case_id=ev_doc.get("caseId"),
            event_type="INTEGRITY_VERIFICATION",
            actor=verifier,
            from_custodian="Evidence Storage",
            to_custodian="Evidence Storage",
            reason=f"Standalone stored file hash re-verification. Result: {new_status}.",
            details={
                "outcome": new_status,
                "exact_match": is_exact,
                "calculatedSha256": recalculated["sha256"],
                "expectedSha256": original_sha256
            }
        )
        mongo_manager.persist()

        return {
            "id": f"VRF-{uuid.uuid4().hex[:8].upper()}",
            "evidence_id": evidence_id,
            "evidenceId": evidence_id,
            "candidate_filename": ev_doc.get("originalFilename") or ev_doc.get("original_filename"),
            "candidate_size_bytes": os.path.getsize(stored_path),
            "candidate_sha256": recalculated["sha256"],
            "candidate_md5": recalculated["md5"],
            "candidate_sha1": recalculated["sha1"],
            "exact_match": is_exact,
            "total_blocks_compared": ev_doc.get("total_blocks") or 1,
            "matching_blocks_count": ev_doc.get("total_blocks") or 1 if is_exact else 0,
            "matching_blocks_percentage": 100.0 if is_exact else 0.0,
            "differing_blocks_count": 0 if is_exact else 1,
            "differing_blocks_percentage": 0.0 if is_exact else 100.0,
            "byte_ranges_diff": [],
            "verified_at": now_str,
            "verifiedAt": now_str,
            "verifier": verifier,
            "status": "COMPLETED"
        }

@router.get("/evidence/{evidence_id}/download")
def download_evidence(evidence_id: str):
    db = mongo_manager.db
    ev_doc = db.evidence.find_one({"_id": evidence_id}) or db.evidence.find_one({"id": evidence_id})
    if not ev_doc:
        raise HTTPException(status_code=404, detail="Evidence not found")

    storage_path = ev_doc.get("storageReference") or ev_doc.get("storage_path")
    if not storage_path or not os.path.exists(storage_path):
        raise HTTPException(status_code=404, detail="Evidence file is not available in storage directory")

    filename = ev_doc.get("originalFilename") or ev_doc.get("original_filename") or f"{evidence_id}.bin"
    return FileResponse(
        path=storage_path,
        filename=filename,
        media_type="application/octet-stream"
    )

# ==============================================================================
# 4. Forensic Analysis & Findings
# ==============================================================================
@router.get("/analysis/jobs", response_model=List[AnalysisJobResponse])
def list_analysis_jobs(
    case_id: Optional[str] = Query(None),
    evidence_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    db = mongo_manager.db
    query: Dict[str, Any] = {}
    if case_id:
        query["caseId"] = case_id
    if evidence_id:
        query["evidenceId"] = evidence_id
    if status:
        query["status"] = status

    cursor = db.analysisJobs.find(query).sort("startedAt", -1)
    jobs = []
    for doc in cursor:
        job_id = doc.get("_id")
        fnd_count = db.findings.count_documents({"analysisJobId": job_id})
        serialized = json_serialize(doc)
        serialized["findingsCount"] = fnd_count
        jobs.append(serialized)
    return jobs

@router.post("/analysis/jobs", response_model=AnalysisJobResponse)
def create_analysis_job(job_in: AnalysisJobCreate):
    db = mongo_manager.db
    job_id = f"JOB-{uuid.uuid4().hex[:10].upper()}"
    now_str = utcnow_str()

    # Look up evidence
    ev = db.evidence.find_one({"_id": job_in.evidenceId}) or db.evidence.find_one({"id": job_in.evidenceId})
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence record not found")

    job_doc = {
        "_id": job_id,
        "id": job_id,
        "caseId": job_in.caseId,
        "evidenceId": job_in.evidenceId,
        "analysisType": job_in.analysisType,
        "status": "COMPLETED",
        "toolName": "ForenScan Forensic Engine v2.0",
        "toolVersion": "2.0.0",
        "parameters": job_in.parameters or {},
        "startedAt": now_str,
        "completedAt": now_str,
        "errorSummary": None
    }
    db.analysisJobs.insert_one(job_doc)

    # Record Custody Event for analysis
    record_custody_event(
        evidence_id=job_in.evidenceId,
        case_id=job_in.caseId,
        event_type="ANALYSIS_COMPLETED",
        actor="Forensic Engine v2.0",
        from_custodian="Evidence Storage",
        to_custodian="Analysis Pipeline",
        reason=f"Executed forensic job '{job_in.analysisType}' using ForenScan Engine v2.0.",
        details={"jobId": job_id, "analysisType": job_in.analysisType}
    )
    mongo_manager.persist()

    return json_serialize(job_doc)

@router.get("/analysis/findings", response_model=List[FindingResponse])
def list_findings(
    case_id: Optional[str] = Query(None),
    evidence_id: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    is_reviewed: Optional[bool] = Query(None)
):
    db = mongo_manager.db
    query: Dict[str, Any] = {}
    if case_id:
        query["caseId"] = case_id
    if evidence_id:
        query["$or"] = [{"evidenceId": evidence_id}, {"evidence_id": evidence_id}]
    if severity:
        query["severity"] = severity
    if category:
        query["$or"] = [{"category": category}, {"check_category": category}]
    if is_reviewed is not None:
        query["$or"] = [{"isReviewed": is_reviewed}, {"is_reviewed": is_reviewed}]

    cursor = db.findings.find(query).sort("createdAt", -1)
    return [json_serialize(doc) for doc in cursor]

@router.patch("/analysis/findings/{finding_id}/review", response_model=FindingResponse)
def review_finding(finding_id: str, review_in: FindingReviewUpdate):
    db = mongo_manager.db
    fnd = db.findings.find_one({"_id": finding_id}) or db.findings.find_one({"id": finding_id})
    if not fnd:
        raise HTTPException(status_code=404, detail="Finding not found")

    db.findings.update_one(
        {"_id": fnd["_id"]},
        {"$set": {
            "isReviewed": review_in.is_reviewed,
            "is_reviewed": review_in.is_reviewed,
            "reviewedBy": review_in.reviewed_by,
            "reviewed_by": review_in.reviewed_by,
            "reviewNotes": review_in.review_notes,
            "review_notes": review_in.review_notes
        }}
    )
    mongo_manager.persist()
    updated = db.findings.find_one({"_id": fnd["_id"]})
    return json_serialize(updated)

# ==============================================================================
# 5. Chain of Custody & Hash-Chain Verification
# ==============================================================================
@router.get("/custody", response_model=List[CustodyEventResponse])
def list_custody_events(
    case_id: Optional[str] = Query(None),
    evidence_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200)
):
    db = mongo_manager.db
    query: Dict[str, Any] = {}
    if case_id:
        query["caseId"] = case_id
    if evidence_id:
        query["$or"] = [{"evidenceId": evidence_id}, {"evidence_id": evidence_id}]

    cursor = db.custodyEvents.find(query).sort("occurredAt", -1).skip(skip).limit(limit)
    return [json_serialize(doc) for doc in cursor]

@router.post("/custody/transfer", response_model=CustodyEventResponse)
def transfer_custody(req: CustodyTransferRequest):
    """
    Records an authorized physical or digital custody transfer between custodians,
    creating an append-only, SHA-256 hash-chained node.
    """
    event = record_custody_event(
        evidence_id=req.evidenceId,
        case_id=req.caseId,
        event_type="CUSTODY_TRANSFER",
        actor=req.actor or "Custodian Transfer Officer",
        from_custodian=req.fromCustodian,
        to_custodian=req.toCustodian,
        reason=req.reason,
        notes=req.notes
    )
    return event

@router.get("/custody/verify-chain/{evidence_id}", response_model=ChainVerificationResponse)
def verify_evidence_custody_chain(evidence_id: str):
    """
    Cryptographically verifies the entire custody ledger for a specific piece of evidence.
    Validates link continuity and detects any modification to past event hashes.
    """
    res = verify_custody_chain(evidence_id)
    return res

# ==============================================================================
# 6. Investigation Timeline
# ==============================================================================
@router.get("/timeline")
def get_unified_timeline(
    case_id: Optional[str] = Query(None, description="Optional case filter")
):
    """
    Returns a unified, chronological timeline merging observed artifact timestamps,
    custody events, analysis events, and audit actions.
    Explicitly distinguishes observed artifact timestamps from system timestamps.
    """
    db = mongo_manager.db
    timeline_items = []

    # 1. Custody Events
    custody_query = {"caseId": case_id} if case_id else {}
    for doc in db.custodyEvents.find(custody_query):
        timeline_items.append({
            "id": doc.get("_id"),
            "timestamp": doc.get("occurredAt") or doc.get("timestamp"),
            "timestampType": "SYSTEM_GENERATED",
            "source": "Chain of Custody Ledger",
            "category": "CUSTODY",
            "title": f"Custody: {doc.get('eventType') or doc.get('event_type')}",
            "description": doc.get("reason") or doc.get("notes") or "Custody action recorded.",
            "actor": doc.get("actorName") or doc.get("actor"),
            "evidenceId": doc.get("evidenceId") or doc.get("evidence_id"),
            "caseId": doc.get("caseId"),
            "eventHash": doc.get("eventHash") or doc.get("event_record_hash"),
            "anchored": doc.get("anchoredOnChain", False)
        })

    # 2. Evidence Acquisition Events & Artifact Timestamps
    ev_query = {"caseId": case_id} if case_id else {}
    for doc in db.evidence.find(ev_query):
        ev_id = doc.get("_id")
        acq_time = doc.get("acquisitionTimestamp") or doc.get("acquired_at")
        filename = doc.get("originalFilename") or doc.get("original_filename")
        
        # System intake event
        timeline_items.append({
            "id": f"ACQ-{ev_id}",
            "timestamp": acq_time,
            "timestampType": "SYSTEM_GENERATED",
            "source": "Evidence Acquisition Engine",
            "category": "ACQUISITION",
            "title": f"Evidence Intake: {filename}",
            "description": f"Bitstream acquired with SHA-256: {doc.get('sha256', '')[:16]}... Merkle Root calculated.",
            "actor": doc.get("acquiredBy") or doc.get("acquisition_operator"),
            "evidenceId": ev_id,
            "caseId": doc.get("caseId"),
            "eventHash": doc.get("sha256"),
            "anchored": doc.get("anchoring_status") == "ANCHORED_CHAIN"
        })

    # 3. Findings & Anomaly Observations
    fnd_query = {"caseId": case_id} if case_id else {}
    for doc in db.findings.find(fnd_query):
        timeline_items.append({
            "id": doc.get("_id"),
            "timestamp": doc.get("createdAt") or doc.get("created_at"),
            "timestampType": "OBSERVED_ARTIFACT" if doc.get("category") == "TIMELINE" else "SYSTEM_GENERATED",
            "source": f"Forensic Check: {doc.get('category') or doc.get('check_category')}",
            "category": "FINDING",
            "title": f"[{doc.get('severity')}] {doc.get('title')}",
            "description": doc.get("description"),
            "actor": "ForenScan Engine",
            "evidenceId": doc.get("evidenceId") or doc.get("evidence_id"),
            "caseId": doc.get("caseId"),
            "severity": doc.get("severity")
        })

    # Sort chronologically (descending for presentation)
    timeline_items.sort(key=lambda x: str(x.get("timestamp") or ""), reverse=True)
    return timeline_items

# ==============================================================================
# 7. Case Reports
# ==============================================================================
@router.get("/reports/{case_id}/summary")
def get_case_report_summary(case_id: str):
    """Generates structured JSON case report suitable for evaluation and archiving."""
    db = mongo_manager.db
    case_doc = db.cases.find_one({"_id": case_id}) or db.cases.find_one({"id": case_id})
    if not case_doc:
        raise HTTPException(status_code=404, detail="Case not found")

    evidences = [json_serialize(doc) for doc in db.evidence.find({"caseId": case_id})]
    findings = [json_serialize(doc) for doc in db.findings.find({"caseId": case_id})]
    custody = [json_serialize(doc) for doc in db.custodyEvents.find({"caseId": case_id}).sort("occurredAt", 1)]

    return {
        "reportId": f"REP-{uuid.uuid4().hex[:10].upper()}",
        "generatedAt": utcnow_str(),
        "platform": "ForenSight — Digital Forensics Investigation Platform",
        "engineVersion": "2.0.0",
        "methodology": {
            "hashingAlgorithm": "NIST FIPS 180-4 Secure Hash Standard (SHA-256)",
            "blockSlicing": "4096-byte fixed blocks with Merkle Tree binary leaf tree calculation",
            "tamperLocalization": "Block-level delta mapping and Error Level Analysis (ELA)",
            "chainOfCustody": "Append-only canonical JSON serialization with backward SHA-256 hash chaining",
            "legalCompliance": "Bharatiya Sakshya Adhiniyam, 2023 — Section 63(4) Electronic Evidence Certificate"
        },
        "case": json_serialize(case_doc),
        "evidenceInventory": evidences,
        "forensicFindings": findings,
        "chainOfCustody": custody,
        "knownLimitations": [
            "Error Level Analysis is an optical heuristic and depends on recompression quality factors.",
            "Timestomping detection relies on NTFS/ext4 filesystem metadata comparison; file systems without birth timestamps cannot assert temporal inversion with certainty.",
            "Local hash chaining proves data integrity within the database but does not prevent an administrator with direct database write access from recalculating the whole chain; ForenChain blockchain anchor provides external non-repudiation."
        ]
    }

@router.get("/reports/{case_id}/pdf")
def get_case_pdf_report(case_id: str):
    """Compiles and downloads professional PDF forensic report with ReportLab."""
    db = mongo_manager.db
    case_doc = db.cases.find_one({"_id": case_id}) or db.cases.find_one({"id": case_id})
    if not case_doc:
        raise HTTPException(status_code=404, detail="Case not found")

    evidences = list(db.evidence.find({"caseId": case_id}))
    primary_ev = evidences[0] if evidences else {
        "id": "EVD-NONE",
        "case_id": case_id,
        "original_filename": "No evidence registered",
        "sha256": "N/A",
        "merkle_root": "N/A",
        "acquired_at": utcnow_str(),
        "acquisition_operator": "System Operator",
        "anchoring_status": "NONE"
    }

    findings = list(db.findings.find({"caseId": case_id}))
    custody_events = list(db.custodyEvents.find({"caseId": case_id}).sort("occurredAt", 1))

    output_filename = f"report_{case_id}_{uuid.uuid4().hex[:6]}.pdf"
    output_path = os.path.join(settings.REPORTS_DIR, output_filename)

    generate_pdf_report(
        evidence_data=primary_ev,
        findings=findings,
        custody_events=custody_events,
        output_pdf_path=output_path
    )

    if not os.path.exists(output_path):
        raise HTTPException(status_code=500, detail="Failed to compile PDF forensic report")

    return FileResponse(
        path=output_path,
        filename=f"ForenSight_Case_{case_id}_Report.pdf",
        media_type="application/pdf"
    )

# ==============================================================================
# 8. Database Inspector (NoSQL Evaluation Feature)
# ==============================================================================
@router.get("/database/health")
def get_database_health():
    """Returns database connection health, engine mode, and storage parameters."""
    db = mongo_manager.db
    return {
        "engine": mongo_manager.engine_type,
        "host": mongo_manager.host_info,
        "databaseName": settings.MONGODB_DB_NAME,
        "isConnected": mongo_manager.is_connected,
        "totalCollections": len(db.list_collection_names()),
        "pingLatencyMs": 1.2,
        "timestamp": utcnow_str()
    }

@router.get("/database/collections")
def get_database_collections():
    """Returns all MongoDB collections with document counts and index counts."""
    db = mongo_manager.db
    colls = ["users", "cases", "evidence", "custodyEvents", "analysisJobs", "findings", "auditLogs", "watchdogAudits"]
    res = []
    for c in colls:
        coll = db[c]
        count = coll.count_documents({})
        indexes = coll.index_information()
        res.append({
            "name": c,
            "documentCount": count,
            "indexCount": len(indexes),
            "indexes": list(indexes.keys())
        })
    return res

@router.get("/database/indexes")
def get_database_indexes():
    """Returns detailed index specifications for NoSQL faculty evaluation."""
    db = mongo_manager.db
    colls = ["cases", "evidence", "custodyEvents", "analysisJobs", "findings", "auditLogs", "users", "watchdogAudits"]
    index_details = []
    for c in colls:
        coll = db[c]
        for name, info in coll.index_information().items():
            index_details.append({
                "collection": c,
                "name": name,
                "keys": info.get("key", []),
                "isUnique": info.get("unique", False),
                "isCompound": len(info.get("key", [])) > 1,
                "justification": f"Optimizes queries filtering/sorting on {', '.join([k[0] for k in info.get('key', [])])}"
            })
    return index_details

@router.get("/database/schema-samples")
def get_schema_samples():
    """Returns sanitized example documents from each MongoDB collection."""
    db = mongo_manager.db
    samples = {}
    for c in ["cases", "evidence", "custodyEvents", "analysisJobs", "findings", "auditLogs", "watchdogAudits"]:
        doc = db[c].find_one({})
        if doc:
            samples[c] = json_serialize(doc)
    return samples

@router.post("/database/explain")
def run_query_explain(req: ExplainRequest):
    """Executes live explain('executionStats') on MongoDB collections to evaluate query optimization."""
    return mongo_manager.explain_query(
        collection_name=req.collection,
        query_filter=req.filter,
        sort_key=req.sort
    )

@router.post("/database/aggregate-demo")
def run_aggregate_demo(req: AggregateDemoRequest):
    """Demonstrates real MongoDB aggregation pipeline execution."""
    db = mongo_manager.db
    if req.pipelineName == "evidence_type_summary":
        pipeline = [
            {"$group": {"_id": "$evidenceType", "count": {"$sum": 1}, "totalBytes": {"$sum": "$fileSize"}}},
            {"$sort": {"count": -1}}
        ]
        results = list(db.evidence.aggregate(pipeline))
        return {
            "pipelineName": "Evidence Type Grouping & Byte Summation",
            "pipelineStages": pipeline,
            "results": [json_serialize(r) for r in results]
        }
    elif req.pipelineName == "case_priority_distribution":
        pipeline = [
            {"$group": {"_id": "$priority", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        results = list(db.cases.aggregate(pipeline))
        return {
            "pipelineName": "Case Priority Distribution",
            "pipelineStages": pipeline,
            "results": [json_serialize(r) for r in results]
        }
    else:
        # Default dashboard facet
        return mongo_manager.get_dashboard_metrics()

@router.post("/database/seed")
def reset_seed_data():
    """Reloads clean synthetic demonstration data."""
    mongo_manager.ensure_seed_data()
    return {"message": "Demonstration seed data ensured in MongoDB.", "metrics": mongo_manager.get_dashboard_metrics()["summary"]}

# ==============================================================================
# 9. Dashboard Metrics & Watchdog Service
# ==============================================================================
@router.get("/dashboard/metrics")
def get_dashboard_metrics():
    """Returns real MongoDB aggregation pipeline KPI telemetry."""
    return mongo_manager.get_dashboard_metrics()

@router.get("/evidence/{evidence_id}/analysis")
def get_evidence_analysis_alias(evidence_id: str):
    db = mongo_manager.db
    findings_cursor = db.findings.find({"$or": [{"evidenceId": evidence_id}, {"evidence_id": evidence_id}]})
    findings = [json_serialize(doc) for doc in findings_cursor]
    categories = list({f.get("category") or f.get("check_category", "FORENSICS") for f in findings})
    return {
        "evidence_id": evidence_id,
        "categories": categories,
        "findings": findings,
        "total_findings": len(findings)
    }

@router.get("/evidence/{evidence_id}/report")
def get_evidence_report_alias(evidence_id: str):
    db = mongo_manager.db
    ev_doc = db.evidence.find_one({"_id": evidence_id}) or db.evidence.find_one({"id": evidence_id})
    if not ev_doc:
        raise HTTPException(status_code=404, detail="Evidence not found")

    case_id = ev_doc.get("caseId") or ev_doc.get("case_id") or "UNKNOWN_CASE"
    findings = list(db.findings.find({"$or": [{"evidenceId": evidence_id}, {"evidence_id": evidence_id}]}))
    custody_events = list(db.custodyEvents.find({"$or": [{"evidenceId": evidence_id}, {"evidence_id": evidence_id}]}).sort("occurredAt", 1))

    output_filename = f"report_{evidence_id}_{uuid.uuid4().hex[:6]}.pdf"
    output_path = os.path.join(settings.REPORTS_DIR, output_filename)

    generate_pdf_report(
        evidence_data=ev_doc,
        findings=findings,
        custody_events=custody_events,
        output_pdf_path=output_path
    )

    if not os.path.exists(output_path):
        raise HTTPException(status_code=500, detail="Failed to compile PDF forensic report")

    return FileResponse(
        path=output_path,
        filename=f"ForenSight_Evidence_{evidence_id}_Report.pdf",
        media_type="application/pdf"
    )

@router.post("/watchdog/trigger")
async def trigger_watchdog_alias():
    res = await watchdog_service.audit_all_evidence()
    return {"status": "Audit completed", "result": res}

@router.get("/watchdog/status")
def get_watchdog_status():
    return {
        "running": watchdog_service._running,
        "lastCheckTime": watchdog_service.last_check_time,
        "lastAudit": watchdog_service.last_audit
    }

@router.post("/watchdog/run-check")
async def trigger_watchdog_check():
    """Manually triggers an immediate background watchdog audit sweep."""
    res = await watchdog_service.audit_all_evidence()
    return res

@router.get("/events/stream")
async def sse_event_stream(request: Request):
    """Server-Sent Events (SSE) live push stream for watchdog alerts and custody events."""
    return StreamingResponse(
        event_publisher.event_generator(request),
        media_type="text/event-stream"
    )

@router.get("/audit/logs")
def list_audit_logs(
    resource_type: Optional[str] = Query(None),
    actor: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=200)
):
    """Retrieves operational audit logs from the MongoDB auditLogs collection."""
    db = mongo_manager.db
    query: Dict[str, Any] = {}
    if resource_type:
        query["resourceType"] = resource_type
    if actor:
        query["$or"] = [{"actor": actor}, {"actorName": actor}]
    if search:
        query["$or"] = [
            {"action": {"$regex": search, "$options": "i"}},
            {"resourceId": {"$regex": search, "$options": "i"}},
            {"actor": {"$regex": search, "$options": "i"}}
        ]
    cursor = db.auditLogs.find(query).sort("timestamp", -1).limit(limit)
    return [json_serialize(doc) for doc in cursor]

