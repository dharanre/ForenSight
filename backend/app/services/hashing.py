import hashlib
from typing import Dict, Tuple

def calculate_file_hashes(file_path: str, chunk_size: int = 65536) -> Dict[str, str]:
    """
    Computes MD5, SHA-1, and SHA-256 for a given file in chunks.
    Non-destructive streaming calculation.
    """
    md5_hash = hashlib.md5()
    sha1_hash = hashlib.sha1()
    sha256_hash = hashlib.sha256()

    with open(file_path, "rb") as f:
        while chunk := f.read(chunk_size):
            md5_hash.update(chunk)
            sha1_hash.update(chunk)
            sha256_hash.update(chunk)

    return {
        "md5": md5_hash.hexdigest().lower(),
        "sha1": sha1_hash.hexdigest().lower(),
        "sha256": sha256_hash.hexdigest().lower()
    }

def calculate_bytes_hashes(data: bytes) -> Dict[str, str]:
    """
    Computes MD5, SHA-1, and SHA-256 for in-memory bytes.
    """
    return {
        "md5": hashlib.md5(data).hexdigest().lower(),
        "sha1": hashlib.sha1(data).hexdigest().lower(),
        "sha256": hashlib.sha256(data).hexdigest().lower()
    }

def verify_file_integrity(file_path: str, expected_sha256: str) -> bool:
    """
    Verifies that the stored file's current SHA-256 exactly matches expected SHA-256.
    """
    current_hashes = calculate_file_hashes(file_path)
    return current_hashes["sha256"] == expected_sha256.lower()
