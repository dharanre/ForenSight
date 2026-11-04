import asyncio
import logging
import os
import uuid
from datetime import datetime, timezone
from app.core.config import settings
from app.core.mongo import mongo_manager, json_serialize
from app.services.hashing import calculate_file_hashes
from app.services.custody import record_custody_event
from app.services.events import event_publisher

logger = logging.getLogger(__name__)

class IntegrityWatchdog:
    def __init__(self):
        self._running = False
        self._task = None
        self.last_check_time = None
        self.last_audit = None

    async def start(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._watchdog_loop())
        logger.info("Integrity Watchdog background service started.")

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Integrity Watchdog stopped.")

    async def _watchdog_loop(self):
        while self._running:
            try:
                await self.audit_all_evidence()
            except Exception as e:
                logger.error(f"Watchdog audit error: {str(e)}")
            
            await asyncio.sleep(settings.WATCHDOG_INTERVAL_SECONDS)

    async def audit_all_evidence(self):
        """
        Periodically re-hashes all stored evidence against recorded MongoDB SHA-256 hashes,
        detects tampering/corruption/deletion, records watchdog custody alerts, and broadcasts SSE.
        """
        audit_id = f"WTD-{uuid.uuid4().hex[:10].upper()}"
        now_utc = datetime.now(timezone.utc)
        now_str = now_utc.isoformat()
        self.last_check_time = now_str

        total_checked = 0
        total_passed = 0
        total_mismatches = 0
        total_missing = 0
        details = []

        db = mongo_manager.db
        from app.core.database import SessionLocal
        from app.models.models import Evidence as SqlEvidence
        sql_db = SessionLocal()

        try:
            evidences = list(db.evidence.find({}))
            # Also include any evidence created directly in SQLite
            try:
                sql_evs = sql_db.query(SqlEvidence).all()
                mongo_ids = {e.get("_id") for e in evidences} | {e.get("id") for e in evidences}
                for sq in sql_evs:
                    if sq.id not in mongo_ids:
                        evidences.append({
                            "_id": sq.id,
                            "id": sq.id,
                            "caseId": sq.case_id,
                            "storageReference": sq.storage_path,
                            "sha256": sq.sha256,
                            "is_sqlite": True
                        })
            except Exception as e_sql:
                logger.debug("SQLite read notice: %s", e_sql)

            for ev in evidences:
                total_checked += 1
                ev_id = ev.get("_id") or ev.get("id")
                storage_path = ev.get("storageReference") or ev.get("storage_path") or ""
                expected_sha256 = (ev.get("sha256") or "").lower()
                case_id = ev.get("caseId") or ev.get("case_id")

                if not storage_path or not os.path.exists(storage_path):
                    total_missing += 1
                    db.evidence.update_one(
                        {"_id": ev_id},
                        {"$set": {"verificationStatus": "MISSING_FROM_STORAGE", "integrity_status": "MISSING_FROM_STORAGE"}}
                    )
                    try:
                        sq_obj = sql_db.query(SqlEvidence).filter(SqlEvidence.id == ev_id).first()
                        if sq_obj:
                            sq_obj.integrity_status = "MISSING_FROM_STORAGE"
                            sql_db.commit()
                    except Exception:
                        pass

                    details.append({
                        "evidence_id": ev_id,
                        "status": "FILE_MISSING",
                        "path": storage_path
                    })
                    record_custody_event(
                        evidence_id=ev_id,
                        case_id=case_id,
                        event_type="WATCHDOG_ALERT",
                        actor="Scheduled Integrity Watchdog",
                        from_custodian="Storage Directory",
                        to_custodian="Missing Anomaly Pool",
                        reason=f"CRITICAL: Evidence file missing from storage path {storage_path}",
                        notes=f"CRITICAL: Evidence file missing from storage path {storage_path}",
                        details={"status": "FILE_MISSING", "path": storage_path}
                    )
                    await event_publisher.broadcast(
                        case_id=case_id,
                        event_type="WATCHDOG_ALERT",
                        data={"evidence_id": ev_id, "alert": "FILE_MISSING", "severity": "CRITICAL"}
                    )
                    continue

                # Recalculate current SHA-256
                current_hashes = calculate_file_hashes(storage_path)
                curr_sha256 = current_hashes["sha256"].lower()

                if curr_sha256 != expected_sha256:
                    total_mismatches += 1
                    db.evidence.update_one(
                        {"_id": ev_id},
                        {"$set": {
                            "verificationStatus": "MISMATCH_DETECTED",
                            "integrity_status": "MISMATCH_DETECTED",
                            "lastVerifiedAt": now_str,
                            "last_verified_at": now_str
                        }}
                    )
                    try:
                        sq_obj = sql_db.query(SqlEvidence).filter(SqlEvidence.id == ev_id).first()
                        if sq_obj:
                            sq_obj.integrity_status = "MISMATCH_DETECTED"
                            sql_db.commit()
                    except Exception as err_s:
                        logger.debug("Failed updating sql: %s", err_s)

                    details.append({
                        "evidence_id": ev_id,
                        "status": "HASH_MISMATCH",
                        "expected_sha256": expected_sha256,
                        "current_sha256": curr_sha256
                    })
                    record_custody_event(
                        evidence_id=ev_id,
                        case_id=case_id,
                        event_type="INTEGRITY_MISMATCH_DETECTED",
                        actor="Scheduled Integrity Watchdog",
                        from_custodian="Evidence Storage",
                        to_custodian="Compromise Investigation Quarantine",
                        reason="CRITICAL: Storage byte variance detected during periodic watchdog sweep.",
                        notes=f"CRITICAL: Storage integrity compromise detected! File rehashed SHA-256 differs from original acquisition.",
                        details={
                            "expected_sha256": expected_sha256,
                            "current_sha256": curr_sha256
                        }
                    )
                    await event_publisher.broadcast(
                        case_id=case_id,
                        event_type="WATCHDOG_ALERT",
                        data={
                            "evidence_id": ev_id,
                            "alert": "HASH_MISMATCH",
                            "severity": "CRITICAL",
                            "expected": expected_sha256,
                            "current": curr_sha256
                        }
                    )
                else:
                    total_passed += 1
                    db.evidence.update_one(
                        {"_id": ev_id},
                        {"$set": {
                            "verificationStatus": "VERIFIED",
                            "integrity_status": "VERIFIED",
                            "lastVerifiedAt": now_str,
                            "last_verified_at": now_str
                        }}
                    )
                    try:
                        sq_obj = sql_db.query(SqlEvidence).filter(SqlEvidence.id == ev_id).first()
                        if sq_obj:
                            sq_obj.integrity_status = "VERIFIED"
                            sql_db.commit()
                    except Exception:
                        pass

            audit_status = "PASSED" if (total_mismatches == 0 and total_missing == 0) else "ANOMALIES_DETECTED"
            
            audit_doc = {
                "_id": audit_id,
                "id": audit_id,
                "runTimestamp": now_str,
                "run_timestamp": now_str,
                "totalChecked": total_checked,
                "total_checked": total_checked,
                "totalPassed": total_passed,
                "total_passed": total_passed,
                "totalMismatches": total_mismatches,
                "total_mismatches": total_mismatches,
                "totalMissing": total_missing,
                "total_missing": total_missing,
                "details": details,
                "status": audit_status
            }
            db.watchdogAudits.insert_one(audit_doc)
            mongo_manager.persist()

            self.last_audit = {
                "id": audit_id,
                "status": audit_status,
                "total_checked": total_checked,
                "total_passed": total_passed,
                "total_mismatches": total_mismatches,
                "total_missing": total_missing
            }
            return audit_doc
        except Exception as err:
            logger.error("Watchdog audit failed: %s", err)
            return {"status": "ERROR", "error": str(err)}

watchdog_service = IntegrityWatchdog()
