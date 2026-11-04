import pytest
import os
import io
from PIL import Image
from app.services.hashing import calculate_bytes_hashes, calculate_file_hashes
from app.services.merkle import MerkleTree, generate_block_manifest
from app.services.file_identity import detect_file_identity
from app.services.tamper_localization import localize_tampering
from app.services.report import generate_pdf_report

@pytest.fixture
def test_files(tmp_path):
    # 1. Base clean JPEG
    img_path = tmp_path / "original.jpg"
    img = Image.new("RGB", (100, 100), color=(73, 109, 137))
    img.save(str(img_path), "JPEG")

    # 2. Tampered JPEG
    tampered_path = tmp_path / "tampered.jpg"
    img_tampered = Image.new("RGB", (100, 100), color=(73, 109, 137))
    # Draw modified square
    for x in range(30, 60):
        for y in range(30, 60):
            img_tampered.putpixel((x, y), (255, 0, 0))
    img_tampered.save(str(tampered_path), "JPEG")

    # 3. Spoofed extension file (claims .pdf but starts with PK..)
    spoofed_path = tmp_path / "fake_document.pdf"
    with open(spoofed_path, "wb") as f:
        f.write(b"PK\x03\x04\x14\x00\x00\x00FakeZipContent")

    return {
        "original": str(img_path),
        "tampered": str(tampered_path),
        "spoofed": str(spoofed_path),
        "tmp_dir": str(tmp_path)
    }

def test_exact_copy_hash(test_files):
    """Test 1: Exact Copy - Same hash and 100% block match"""
    hashes_orig = calculate_file_hashes(test_files["original"])
    hashes_copy = calculate_file_hashes(test_files["original"])
    assert hashes_orig["sha256"] == hashes_copy["sha256"]
    assert hashes_orig["md5"] == hashes_copy["md5"]

def test_merkle_tree_consistency():
    """Test 5: Merkle Integrity - Deterministic root and proof validation"""
    leaves = [
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
        "3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d"
    ]
    root1 = MerkleTree.compute_root_from_leaves(leaves)
    root2 = MerkleTree.compute_root_from_leaves(leaves)
    assert root1 == root2

    # Proof verification
    proof = MerkleTree.generate_proof(leaves, 1)
    is_valid = MerkleTree.verify_proof(leaves[1], proof, root1)
    assert is_valid is True

    # Tampered leaf fails
    is_valid_bad = MerkleTree.verify_proof("badhash", proof, root1)
    assert is_valid_bad is False

def test_file_extension_mismatch(test_files):
    """Test 3: File Extension Mismatch Detection"""
    id_res = detect_file_identity(test_files["spoofed"], "fake_document.pdf")
    assert id_res["is_extension_matched"] is False
    assert id_res["detected_mime"] == "application/zip"
    assert any(f["severity"] in ["HIGH", "CRITICAL"] for f in id_res["findings"])

def test_tamper_localization_modified_image(test_files):
    """Test 2: Modified Image - Tamper detection and changed blocks"""
    # Create manifest for original
    manifest_path = os.path.join(test_files["tmp_dir"], "orig_manifest.json")
    orig_manifest = generate_block_manifest(test_files["original"], block_size=512)
    with open(manifest_path, "w") as f:
        import json
        json.dump(orig_manifest, f)

    # Localize tampering
    heatmap_path = os.path.join(test_files["tmp_dir"], "diff_heatmap.png")
    result = localize_tampering(
        ref_file_path=test_files["original"],
        cand_file_path=test_files["tampered"],
        ref_manifest_path=manifest_path,
        output_heatmap_path=heatmap_path
    )

    assert result["differing_blocks_count"] > 0
    assert result["matching_blocks_percentage"] < 100.0
    assert result["visual_similarity_percentage"] is not None
    assert os.path.exists(heatmap_path)

def test_pdf_report_generation(test_files):
    """Test 7: PDF Forensic Report and BSA 63(4) Draft"""
    report_pdf = os.path.join(test_files["tmp_dir"], "sample_report.pdf")
    evidence_data = {
        "id": "EVD-TEST1234",
        "case_id": "CASE-AUDIT-1",
        "original_filename": "photo.jpg",
        "file_size_bytes": 1024,
        "claimed_extension": ".jpg",
        "detected_mime_type": "image/jpeg",
        "sha256": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        "md5": "0123456789abcdef0123456789abcdef",
        "sha1": "1234567890123456789012345678901234567890",
        "merkle_root": "fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
        "total_blocks": 4,
        "acquired_at": "2026-10-13T10:00:00Z",
        "acquisition_operator": "Investigator Dave",
        "anchoring_status": "FALLBACK_DB",
        "blockchain_tx_hash": None
    }
    rep_res = generate_pdf_report(
        evidence_data=evidence_data,
        findings=[],
        custody_events=[],
        output_pdf_path=report_pdf
    )
    assert os.path.exists(report_pdf)
    assert os.path.getsize(report_pdf) > 0
    assert rep_res["report_sha256"] is not None
