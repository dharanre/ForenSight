import os
import uuid
import shutil
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.mongo import mongo_manager, json_serialize
from app.models.models import Case, Evidence, ForensicFinding
from app.services.hashing import calculate_file_hashes
from app.services.merkle import generate_block_manifest, save_manifest
from app.services.file_identity import detect_file_identity
from app.services.metadata import extract_metadata_and_findings
from app.services.manipulation import analyze_manipulation_single
from app.services.timeline import analyze_timeline_consistency
from app.services.blockchain import blockchain_service
from app.services.custody import record_custody_event

def acquire_and_register_evidence(
    db: Optional[Session],
    case_id: str,
    original_filename: str,
    temp_file_path: str,
    acquisition_operator: str = "Forensic Analyst",
    acquisition_notes: str = None,
    source_device: str = None,
    evidence_type: str = "DOCUMENT"
) -> Any:
    """
    Core Module A: Evidence Acquisition & Initial 5-Check Forensic Pipeline.
    1. Generates secure evidence ID and evidence number.
    2. Hashes file (MD5, SHA-1, SHA-256).
    3. Moves file safely to controlled evidence store.
    4. Slices blocks, generates Merkle root, stores off-chain manifest.
    5. Runs Checks 1-5 (Acquisition, File Identity, Metadata, Manipulation, Timeline).
    6. Stores in MongoDB primary operational database (with schema validation & indexes).
    7. Anchors on ForenChain smart contract (with DB fallback).
    8. Records hash-linked Chain-of-Custody event.
    """
    evidence_id = f"EVD-{uuid.uuid4().hex[:10].upper()}"
    file_size = os.path.getsize(temp_file_path)

    # 1. Multi-Hash Calculation
    hashes = calculate_file_hashes(temp_file_path)

    # 2. Secure storage filename & move
    _, ext = os.path.splitext(original_filename)
    safe_storage_filename = f"{evidence_id}_{hashes['sha256'][:12]}{ext.lower()}"
    permanent_storage_path = os.path.join(settings.EVIDENCE_DIR, safe_storage_filename)
    shutil.copy2(temp_file_path, permanent_storage_path)

    # Verify copied file integrity immediately
    verify_hashes = calculate_file_hashes(permanent_storage_path)
    if verify_hashes["sha256"] != hashes["sha256"]:
        raise ValueError("Acquisition integrity verification failed: Stored byte hash mismatch!")

    # 3. Block Merkle Tree Generation
    manifest = generate_block_manifest(permanent_storage_path, block_size=settings.BLOCK_SIZE_BYTES)
    manifest_filename = f"{evidence_id}_manifest.json"
    manifest_path = os.path.join(settings.MANIFESTS_DIR, manifest_filename)
    save_manifest(manifest, manifest_path)
    merkle_root = manifest["merkle_root"]

    # 4. Check 2: File Identity & Magic Bytes / EOF Marker
    identity_res = detect_file_identity(permanent_storage_path, original_filename)

    # Infer evidenceType from detected mime if default
    detected_mime = identity_res.get("detected_mime", "application/octet-stream")
    if "image" in detected_mime:
        evidence_type = "IMAGE_FILE"
    elif "pdf" in detected_mime:
        evidence_type = "DOCUMENT"
    elif "text" in detected_mime or "json" in detected_mime or "log" in detected_mime:
        evidence_type = "LOG_FILE"
    elif "pcap" in original_filename.lower():
        evidence_type = "NETWORK_PCAP"
    elif "raw" in original_filename.lower() or "dmp" in original_filename.lower():
        evidence_type = "MEMORY_DUMP"

    # 5. Check 3: Metadata Extraction (EXIF, GPS, Office)
    meta_res = extract_metadata_and_findings(permanent_storage_path, detected_mime)

    # 6. Check 4: Manipulation (Initial ELA & Perceptual Hashes)
    ela_filename = f"{evidence_id}_ela.png"
    ela_path = os.path.join(settings.FINDINGS_DIR, ela_filename)
    manip_findings = analyze_manipulation_single(
        permanent_storage_path,
        detected_mime,
        ela_path
    )

    # 7. Check 5: Timeline Consistency
    now_dt = datetime.now(timezone.utc)
    acquired_at_iso = now_dt.isoformat()
    timeline_findings = analyze_timeline_consistency(
        acquired_at=now_dt,
        metadata=meta_res.get("metadata", {})
    )

    # Check 1: Acquisition integrity finding
    acq_findings = [{
        "check_category": "ACQUISITION",
        "category": "ACQUISITION",
        "severity": "INFO",
        "title": "Initial Acquisition Fingerprints Established",
        "description": f"File acquired cleanly. Primary SHA-256: {hashes['sha256']}. Merkle Root: {merkle_root}.",
        "supporting_observations": {
            "md5": hashes["md5"],
            "sha1": hashes["sha1"],
            "sha256": hashes["sha256"],
            "merkle_root": merkle_root,
            "total_blocks": manifest["total_blocks"]
        },
        "confidence": "HIGH",
        "recommendation": "Preserve unmodified original file in controlled storage."
    }]

    all_raw_findings = acq_findings + identity_res.get("findings", []) + meta_res.get("findings", []) + manip_findings + timeline_findings

    # Generate globally unique evidenceNumber to satisfy MongoDB uniqueness constraint
    evidence_number = f"EVD-{uuid.uuid4().hex[:8].upper()}"

    # Summary report hash
    findings_summary = f"{evidence_id}:{hashes['sha256']}:{merkle_root}:{len(all_raw_findings)}"
    report_hash = hashlib.sha256(findings_summary.encode("utf-8")).hexdigest().lower()

    # Blockchain anchoring
    anchor_res = blockchain_service.anchor_evidence(
        evidence_id=evidence_id,
        sha256_hash=hashes["sha256"],
        merkle_root=merkle_root,
        analysis_report_hash=report_hash
    )

    anchoring_status = anchor_res.get("status", "FALLBACK_DB")
    tx_hash = anchor_res.get("tx_hash")
    block_num = anchor_res.get("block_number")

    # 8. MongoDB Evidence Document (Primary Operational Storage)
    evidence_doc = {
        "_id": evidence_id,
        "id": evidence_id,
        "caseId": case_id,
        "case_id": case_id,
        "evidenceNumber": evidence_number,
        "originalFilename": original_filename,
        "original_filename": original_filename,
        "fileSize": file_size,
        "file_size_bytes": file_size,
        "claimedExtension": ext.lower() if ext else ".unknown",
        "claimed_extension": ext.lower() if ext else ".unknown",
        "detectedFileType": detected_mime,
        "detected_mime_type": detected_mime,
        "evidenceType": evidence_type,
        "sha256": hashes["sha256"],
        "md5": hashes["md5"],
        "sha1": hashes["sha1"],
        "storageReference": permanent_storage_path,
        "storage_path": permanent_storage_path,
        "acquisitionMetadata": {
            "sourceDevice": source_device or "N/A",
            "acquisitionOperator": acquisition_operator,
            "acquisitionNotes": acquisition_notes or "",
            "claimedExtension": ext.lower() if ext else ".unknown",
            "blockSizeBytes": settings.BLOCK_SIZE_BYTES,
            "totalBlocks": manifest["total_blocks"],
            "merkleRoot": merkle_root,
            "manifestPath": manifest_path
        },
        "acquisitionTimestamp": acquired_at_iso,
        "acquired_at": acquired_at_iso,
        "acquiredBy": acquisition_operator,
        "acquisition_operator": acquisition_operator,
        "acquisition_notes": acquisition_notes,
        "source_device": source_device,
        "total_blocks": manifest["total_blocks"],
        "merkle_root": merkle_root,
        "block_size_bytes": settings.BLOCK_SIZE_BYTES,
        "analysis_status": "COMPLETED",
        "anchoring_status": anchoring_status,
        "blockchain_tx_hash": tx_hash,
        "blockchain_block_number": block_num,
        "analysis_report_hash": report_hash,
        "integrity_status": "VERIFIED",
        "verificationStatus": "VERIFIED",
        "lastVerifiedAt": acquired_at_iso,
        "last_verified_at": acquired_at_iso,
        "createdAt": acquired_at_iso
    }
    mongo_manager.db.evidence.insert_one(evidence_doc)

    # 9. Store Findings into MongoDB
    for f in all_raw_findings:
        fnd_id = f"FND-{uuid.uuid4().hex[:10].upper()}"
        finding_doc = {
            "_id": fnd_id,
            "id": fnd_id,
            "evidenceId": evidence_id,
            "evidence_id": evidence_id,
            "caseId": case_id,
            "analysisJobId": None,
            "category": f.get("check_category") or f.get("category", "FORENSICS"),
            "check_category": f.get("check_category") or f.get("category", "FORENSICS"),
            "severity": f.get("severity", "INFO"),
            "title": f.get("title", "Forensic Finding"),
            "description": f.get("description", ""),
            "supportingArtifactReferences": [f.get("supporting_observations")] if f.get("supporting_observations") else [],
            "supporting_observations": f.get("supporting_observations"),
            "measurements": f.get("measurements") or {},
            "confidence": f.get("confidence", "HIGH"),
            "recommendation": f.get("recommendation"),
            "isReviewed": False,
            "is_reviewed": False,
            "reviewedBy": None,
            "reviewNotes": None,
            "createdAt": acquired_at_iso,
            "created_at": acquired_at_iso
        }
        mongo_manager.db.findings.insert_one(finding_doc)

    # 10. Record Custody Event
    record_custody_event(
        evidence_id=evidence_id,
        event_type="EVIDENCE_ACQUIRED",
        actor=acquisition_operator,
        case_id=case_id,
        from_custodian=source_device or "Source Media",
        to_custodian=f"Evidence Locker ({acquisition_operator})",
        reason=f"Acquired '{original_filename}'. Multi-hash calculated and Merkle block tree generated.",
        notes=acquisition_notes,
        details={
            "sha256": hashes["sha256"],
            "merkle_root": merkle_root,
            "total_blocks": manifest["total_blocks"],
            "anchoring_status": anchoring_status,
            "tx_hash": tx_hash
        }
    )

    # 11. Log Audit
    mongo_manager.log_audit(
        actor_id=acquisition_operator,
        actor_name=acquisition_operator,
        action="EVIDENCE_ACQUIRED",
        resource_type="EVIDENCE",
        resource_id=evidence_id,
        details={
            "caseId": case_id,
            "filename": original_filename,
            "sha256": hashes["sha256"],
            "fileSize": file_size
        }
    )
    mongo_manager.persist()

    # Also sync to SQLite if db Session provided (backward compatibility)
    if db is not None:
        try:
            ev_sql = Evidence(
                id=evidence_id,
                case_id=case_id,
                original_filename=original_filename,
                storage_path=permanent_storage_path,
                file_size_bytes=file_size,
                claimed_extension=ext.lower() if ext else ".unknown",
                detected_mime_type=detected_mime,
                sha256=hashes["sha256"],
                md5=hashes["md5"],
                sha1=hashes["sha1"],
                block_size_bytes=settings.BLOCK_SIZE_BYTES,
                total_blocks=manifest["total_blocks"],
                merkle_root=merkle_root,
                manifest_path=manifest_path,
                acquired_at=now_dt,
                acquisition_operator=acquisition_operator,
                acquisition_notes=acquisition_notes,
                source_device=source_device,
                analysis_status="COMPLETED",
                anchoring_status=anchoring_status,
                integrity_status="VERIFIED"
            )
            db.add(ev_sql)
            db.commit()
            db.refresh(ev_sql)
            return ev_sql
        except Exception as sql_err:
            logger.debug("SQLite sync notice: %s", sql_err)

    return evidence_doc
