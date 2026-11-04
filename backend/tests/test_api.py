import pytest
import os
import io
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.core.database import SessionLocal, Base, engine
from app.models.models import Evidence

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield

def test_api_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "blockchain_connected" in data

def test_evidence_acquisition_and_verification_workflow():
    # 1. Create a dummy test image
    img = Image.new("RGB", (80, 80), color=(100, 150, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    # 2. Upload and register evidence
    files = {"file": ("scene_photo.jpg", buf, "image/jpeg")}
    data = {
        "case_id": "CASE-TEST-001",
        "acquisition_operator": "Investigator Agent",
        "acquisition_notes": "Initial acquisition test",
        "source_device": "Digital Forensic Workstation 01"
    }
    res = client.post("/api/v1/evidence", data=data, files=files)
    assert res.status_code == 200
    ev_data = res.json()
    assert ev_data["id"].startswith("EVD-")
    assert ev_data["sha256"] is not None
    assert ev_data["merkle_root"] is not None
    assert ev_data["anchoring_status"] in ["ANCHORED_CHAIN", "FALLBACK_DB"]

    evidence_id = ev_data["id"]

    # 3. Retrieve analysis findings
    res_analysis = client.get(f"/api/v1/evidence/{evidence_id}/analysis")
    assert res_analysis.status_code == 200
    analysis = res_analysis.json()
    assert "ACQUISITION" in analysis["categories"]
    assert "FILE_IDENTITY" in analysis["categories"]

    # 4. Verification with identical copy (Exact match)
    buf.seek(0)
    files_verify = {"file": ("scene_photo_copy.jpg", buf, "image/jpeg")}
    res_verify = client.post(f"/api/v1/evidence/{evidence_id}/verify", data={"verifier": "Analyst Bob"}, files=files_verify)
    assert res_verify.status_code == 200
    v_data = res_verify.json()
    assert v_data["exact_match"] is True
    assert v_data["differing_blocks_count"] == 0
    assert v_data["matching_blocks_percentage"] == 100.0

    # 5. Verification with modified copy (Tampered)
    img_mod = Image.new("RGB", (80, 80), color=(100, 150, 200))
    for x in range(20, 40):
        for y in range(20, 40):
            img_mod.putpixel((x, y), (255, 0, 0)) # Spliced square
    buf_mod = io.BytesIO()
    img_mod.save(buf_mod, format="JPEG")
    buf_mod.seek(0)

    files_tampered = {"file": ("scene_photo_tampered.jpg", buf_mod, "image/jpeg")}
    res_tampered = client.post(f"/api/v1/evidence/{evidence_id}/verify", data={"verifier": "Analyst Bob"}, files=files_tampered)
    assert res_tampered.status_code == 200
    t_data = res_tampered.json()
    assert t_data["exact_match"] is False
    assert t_data["differing_blocks_count"] > 0
    assert t_data["visual_similarity_percentage"] is not None

    # 6. Download PDF Report
    res_report = client.get(f"/api/v1/evidence/{evidence_id}/report")
    assert res_report.status_code == 200
    assert res_report.headers["content-type"] == "application/pdf"
    assert len(res_report.content) > 1000

    # 7. Watchdog Trigger
    res_wd = client.post("/api/v1/watchdog/trigger")
    assert res_wd.status_code == 200
    assert res_wd.json()["status"] == "Audit completed"

def test_watchdog_detects_storage_tampering(tmp_path):
    """Test 8: Scheduled Watchdog detects tampered file in storage"""
    import uuid
    db = SessionLocal()
    # Create disposable test file
    test_file = tmp_path / "tamper_target.bin"
    test_file.write_bytes(b"ORIGINAL_STORAGE_CONTENT_12345")

    # Manually register in DB
    from app.services.hashing import calculate_file_hashes
    hashes = calculate_file_hashes(str(test_file))
    
    unique_ev_id = f"EVD-WD-{uuid.uuid4().hex[:8].upper()}"
    ev = Evidence(
        id=unique_ev_id,
        case_id="CASE-WD",
        original_filename="tamper_target.bin",
        storage_path=str(test_file),
        file_size_bytes=len(b"ORIGINAL_STORAGE_CONTENT_12345"),
        claimed_extension=".bin",
        detected_mime_type="application/octet-stream",
        sha256=hashes["sha256"],
        md5=hashes["md5"],
        sha1=hashes["sha1"],
        block_size_bytes=512,
        total_blocks=1,
        merkle_root=hashes["sha256"],
        analysis_status="COMPLETED",
        anchoring_status="FALLBACK_DB",
        integrity_status="VERIFIED"
    )
    db.add(ev)
    db.commit()
    db.close()

    # Now alter the file on disk!
    test_file.write_bytes(b"TAMPERED_MODIFIED_STORAGE_BYTE$")

    # Trigger watchdog
    res = client.post("/api/v1/watchdog/trigger")
    assert res.status_code == 200

    # Check evidence status in DB
    db2 = SessionLocal()
    ev_updated = db2.query(Evidence).filter(Evidence.id == unique_ev_id).first()
    assert ev_updated.integrity_status == "MISMATCH_DETECTED"
    db2.close()
