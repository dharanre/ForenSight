import os
from typing import Dict, Any, List

# Known Magic Byte signatures
SIGNATURES = {
    b"\xFF\xD8\xFF": ("image/jpeg", [".jpg", ".jpeg"]),
    b"\x89PNG\r\n\x1a\n": ("image/png", [".png"]),
    b"%PDF-": ("application/pdf", [".pdf"]),
    b"PK\x03\x04": ("application/zip", [".zip", ".docx", ".xlsx", ".pptx"]),
    b"\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1": ("application/x-ole-storage", [".doc", ".xls", ".ppt"]),
    b"GIF87a": ("image/gif", [".gif"]),
    b"GIF89a": ("image/gif", [".gif"]),
    b"BM": ("image/bmp", [".bmp"]),
    b"RIFF": ("image/webp", [".webp", ".avi", ".wav"])
}

# Standard End-of-File Markers for supported formats
EOF_MARKERS = {
    "image/jpeg": b"\xFF\xD9",
    "application/pdf": b"%%EOF"
}

def detect_file_identity(file_path: str, claimed_filename: str) -> Dict[str, Any]:
    """
    Performs Check 2: File Identity and Hidden Data.
    Analyzes magic bytes, MIME types, extension consistency, and checks for trailing data after EOF.
    """
    _, ext = os.path.splitext(claimed_filename)
    claimed_ext = ext.lower()
    
    file_size = os.path.getsize(file_path)
    if file_size == 0:
        return {
            "detected_mime": "application/x-empty",
            "detected_type_name": "Empty File",
            "claimed_ext": claimed_ext,
            "is_extension_matched": False,
            "has_trailing_data": False,
            "trailing_bytes_count": 0,
            "findings": [{
                "check_category": "FILE_IDENTITY",
                "severity": "HIGH",
                "title": "Empty File Uploaded",
                "description": "The file contains 0 bytes and cannot be forensically validated.",
                "confidence": "HIGH",
                "recommendation": "Acquire a valid non-empty file."
            }]
        }

    with open(file_path, "rb") as f:
        header = f.read(32)
        
    detected_mime = "application/octet-stream"
    detected_name = "Unknown Binary"
    valid_extensions: List[str] = []

    for sig, (mime, exts) in SIGNATURES.items():
        if header.startswith(sig):
            detected_mime = mime
            valid_extensions = exts
            if mime == "image/jpeg":
                detected_name = "JPEG Image"
            elif mime == "image/png":
                detected_name = "PNG Image"
            elif mime == "application/pdf":
                detected_name = "PDF Document"
            elif mime == "application/zip":
                # Check if it's Office Open XML
                detected_name = "Zip Archive / Office Open XML"
            elif mime == "application/x-ole-storage":
                detected_name = "Microsoft Compound File (Legacy Office)"
            break

    # If MIME matches ZIP and extension is docx/xlsx/pptx, refine
    if detected_mime == "application/zip" and claimed_ext in [".docx", ".xlsx", ".pptx"]:
        detected_mime = "application/vnd.openxmlformats-officedocument"
        detected_name = f"Office Open XML Document ({claimed_ext})"

    is_matched = (claimed_ext in valid_extensions) or (
        detected_mime == "application/vnd.openxmlformats-officedocument" and claimed_ext in [".docx", ".xlsx", ".pptx"]
    )

    findings = []

    # Check 1: Extension mismatch finding
    if not is_matched and detected_mime != "application/octet-stream":
        findings.append({
            "check_category": "FILE_IDENTITY",
            "severity": "CRITICAL" if claimed_ext in [".pdf", ".jpg", ".png"] else "HIGH",
            "title": "Mismatched File Extension Detected",
            "description": f"File claims extension '{claimed_ext}' but magic bytes header corresponds to '{detected_mime}' ({detected_name}).",
            "supporting_observations": {
                "claimed_extension": claimed_ext,
                "detected_mime": detected_mime,
                "header_hex": header[:16].hex()
            },
            "confidence": "HIGH",
            "recommendation": "Investigate source of file. Possible masquerading attempt or extension spoofing."
        })
    elif detected_mime == "application/octet-stream":
        findings.append({
            "check_category": "FILE_IDENTITY",
            "severity": "MEDIUM",
            "title": "Unrecognized File Signature",
            "description": f"File signature could not be matched against standard known binary headers.",
            "supporting_observations": {
                "header_hex": header[:16].hex()
            },
            "confidence": "MEDIUM",
            "recommendation": "Analyze with comprehensive file carvers or specialized format parsers."
        })
    else:
        findings.append({
            "check_category": "FILE_IDENTITY",
            "severity": "INFO",
            "title": "File Identity Verified",
            "description": f"Magic bytes match claimed extension '{claimed_ext}' as {detected_name}.",
            "confidence": "HIGH",
            "recommendation": "Proceed with metadata and manipulation analysis."
        })

    # Check 2: Trailing data after EOF marker
    has_trailing_data = False
    trailing_bytes = 0
    if detected_mime in EOF_MARKERS:
        marker = EOF_MARKERS[detected_mime]
        with open(file_path, "rb") as f:
            content = f.read()
            last_idx = content.rfind(marker)
            if last_idx != -1:
                end_pos = last_idx + len(marker)
                trailing_bytes = len(content) - end_pos
                if trailing_bytes > 0:
                    has_trailing_data = True
                    findings.append({
                        "check_category": "FILE_IDENTITY",
                        "severity": "HIGH",
                        "title": "Suspicious Appended Data Detected After EOF",
                        "description": f"Found {trailing_bytes} bytes appended after the standard end-of-file marker '{marker.decode('latin1', errors='replace')}'.",
                        "supporting_observations": {
                            "eof_marker_offset": last_idx,
                            "trailing_bytes_count": trailing_bytes,
                            "trailing_preview_hex": content[end_pos:end_pos+32].hex()
                        },
                        "confidence": "HIGH",
                        "recommendation": "Perform binary carving on trailing payload to inspect for hidden archive, polyglot data, or steganographic content."
                    })

    return {
        "detected_mime": detected_mime,
        "detected_type_name": detected_name,
        "claimed_ext": claimed_ext,
        "is_extension_matched": is_matched,
        "has_trailing_data": has_trailing_data,
        "trailing_bytes_count": trailing_bytes,
        "findings": findings
    }
