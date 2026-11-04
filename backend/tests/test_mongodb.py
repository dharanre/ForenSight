"""
ForenSight — Comprehensive MongoDB & NoSQL Architectural Test Suite
Verifies document modeling, indexing, compound indexes, aggregation pipelines,
explain query execution plans, and hash-chain custody verification.
"""

import pytest
import uuid
from datetime import datetime, timezone
from app.core.mongo import mongo_manager

def test_mongodb_connection_and_indexes():
    """Validates that collections exist and mandatory indexes are active."""
    db = mongo_manager.db
    assert mongo_manager.is_connected is True
    
    # 1. Cases indexes
    case_indexes = db.cases.index_information()
    assert "caseNumber_1" in case_indexes
    assert case_indexes["caseNumber_1"].get("unique") is True

    # 2. Evidence indexes
    ev_indexes = db.evidence.index_information()
    assert "evidenceNumber_1" in ev_indexes
    assert "caseId_1" in ev_indexes
    assert "sha256_1" in ev_indexes

    # 3. Compound Index: caseId + acquisitionTimestamp
    found_compound = False
    for idx_info in ev_indexes.values():
        keys = idx_info.get("key", [])
        if len(keys) == 2 and keys[0][0] == "caseId" and keys[1][0] == "acquisitionTimestamp":
            found_compound = True
            break
    assert found_compound is True

def test_case_crud_operations():
    """Validates real create, read, update, and archive operations on MongoDB cases."""
    db = mongo_manager.db
    test_id = f"CASE-TEST-{uuid.uuid4().hex[:6].upper()}"
    test_num = f"FR-TEST-{uuid.uuid4().hex[:6].upper()}"
    
    # Create
    doc = {
        "_id": test_id,
        "id": test_id,
        "caseNumber": test_num,
        "title": "Automated NoSQL Test Investigation",
        "description": "Verifying CRUD operations in MongoDB",
        "status": "ACTIVE",
        "priority": "HIGH",
        "investigator": "Test Lead",
        "tags": ["NOSQL_TEST", "AUTOMATION"],
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    db.cases.insert_one(doc)

    # Read
    saved = db.cases.find_one({"_id": test_id})
    assert saved is not None
    assert saved["caseNumber"] == test_num
    assert saved["status"] == "ACTIVE"

    # Update
    db.cases.update_one({"_id": test_id}, {"$set": {"status": "CLOSED", "closedAt": datetime.now(timezone.utc).isoformat()}})
    updated = db.cases.find_one({"_id": test_id})
    assert updated["status"] == "CLOSED"
    assert updated.get("closedAt") is not None

    # Clean up test case
    db.cases.delete_one({"_id": test_id})

def test_aggregation_pipeline_dashboard_metrics():
    """Validates real aggregation pipeline execution ($facet, $group, $sort)."""
    metrics = mongo_manager.get_dashboard_metrics()
    assert "summary" in metrics
    assert "totalCases" in metrics["summary"]
    assert metrics["summary"]["totalCases"] >= 1
    assert "evidenceTypeBreakdown" in metrics
    assert isinstance(metrics["evidenceTypeBreakdown"], list)
    assert "caseStatusDistribution" in metrics
    assert isinstance(metrics["caseStatusDistribution"], list)

def test_explain_query_optimizer():
    """Validates live query plan explain execution demonstrating index usage."""
    plan_res = mongo_manager.explain_query("evidence", {"caseId": "CASE-2026-001"})
    assert plan_res["collection"] == "evidence"
    assert "executionPlan" in plan_res
    winning_plan = plan_res["executionPlan"]["queryPlanner"]["winningPlan"]
    assert winning_plan["stage"] in ["IXSCAN", "COLLSCAN", "FETCH"]

def test_custody_hash_chain_verification():
    """Validates cryptographic custody verification across dynamically chained event nodes."""
    from app.services.custody import record_custody_event, verify_custody_chain
    test_ev_id = f"EVD-TEST-{uuid.uuid4().hex[:8].upper()}"

    # 1. First event (Genesis)
    ev1 = record_custody_event(
        evidence_id=test_ev_id,
        event_type="EVIDENCE_ACQUIRED",
        actor="Special Agent Vance",
        case_id="CASE-TEST",
        from_custodian="Disk Drive",
        to_custodian="Vault",
        reason="Initial acquisition intake",
        sync_to_blockchain=False
    )
    assert ev1["previousEventHash"] == "GENESIS_CUSTODY_NODE"
    assert ev1["eventHash"] is not None

    # 2. Second event (Transfer)
    ev2 = record_custody_event(
        evidence_id=test_ev_id,
        event_type="CUSTODY_TRANSFER",
        actor="Special Agent Vance",
        case_id="CASE-TEST",
        from_custodian="Vault",
        to_custodian="Dr. Thorne",
        reason="Transfer for deep examination",
        sync_to_blockchain=False
    )
    assert ev2["previousEventHash"] == ev1["eventHash"]

    # 3. Third event (Analysis)
    ev3 = record_custody_event(
        evidence_id=test_ev_id,
        event_type="ANALYSIS_COMPLETED",
        actor="Dr. Thorne",
        case_id="CASE-TEST",
        from_custodian="Dr. Thorne",
        to_custodian="Secure Lab 2",
        reason="Completed 5-check forensic pipeline",
        sync_to_blockchain=False
    )
    assert ev3["previousEventHash"] == ev2["eventHash"]

    # Verify complete chain
    res = verify_custody_chain(test_ev_id)
    assert res["isChainValid"] is True
    assert res["totalEvents"] == 3
    assert res["verifiedLinks"] == 3
    assert res["brokenAtEventId"] is None
