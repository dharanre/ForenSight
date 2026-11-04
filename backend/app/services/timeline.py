from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import re

def parse_iso_or_exif_date(date_str: str) -> Optional[datetime]:
    if not date_str or not isinstance(date_str, str):
        return None
    # EXIF format: "YYYY:MM:DD HH:MM:SS"
    try:
        if re.match(r"^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}", date_str):
            clean_str = date_str[:19].replace(":", "-", 2)
            dt = datetime.strptime(clean_str, "%Y-%m-%d %H:%M:%S")
            return dt.replace(tzinfo=timezone.utc)
    except Exception:
        pass

    # ISO format
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        pass

    return None

def analyze_timeline_consistency(
    acquired_at: datetime,
    metadata: Dict[str, Any],
    custody_events: Optional[List[Dict[str, Any]]] = None
) -> List[Dict[str, Any]]:
    """
    Performs Check 5: Timeline and Anomaly Analysis.
    Compares embedded dates (DateTimeOriginal, ModifyDate, creation date) with acquisition time.
    Flags timestamp inversions, impossible dates, and discrepancies.
    """
    findings = []
    
    # Try finding date fields in metadata
    meta_create_str = (
        metadata.get("DateTimeOriginal") or 
        metadata.get("CreateDate") or 
        metadata.get("CreationDate") or 
        metadata.get("created")
    )
    meta_modify_str = (
        metadata.get("ModifyDate") or 
        metadata.get("DateTime") or 
        metadata.get("ModDate") or 
        metadata.get("modified")
    )

    create_dt = parse_iso_or_exif_date(meta_create_str)
    modify_dt = parse_iso_or_exif_date(meta_modify_str)

    # Rule 1: Modification date precedes creation date
    if create_dt and modify_dt:
        if modify_dt < create_dt:
            findings.append({
                "check_category": "TIMELINE",
                "severity": "HIGH",
                "title": "Temporal Inversion Detected",
                "description": f"File modification timestamp ({modify_dt.isoformat()}) is earlier than its creation timestamp ({create_dt.isoformat()}).",
                "supporting_observations": {
                    "creation_timestamp": create_dt.isoformat(),
                    "modification_timestamp": modify_dt.isoformat(),
                    "delta_seconds": (create_dt - modify_dt).total_seconds()
                },
                "confidence": "HIGH",
                "recommendation": "Examine file filesystem journals. Potential timestamp manipulation (timestomping) or clock skew during editing."
            })
        else:
            findings.append({
                "check_category": "TIMELINE",
                "severity": "INFO",
                "title": "Creation and Modification Sequence Normal",
                "description": f"Creation ({create_dt.isoformat()}) preceded modification ({modify_dt.isoformat()}) as expected.",
                "confidence": "HIGH",
                "recommendation": "No chronological inversions observed."
            })

    # Rule 2: Metadata timestamp in the future compared to acquisition
    if create_dt and acquired_at:
        if create_dt > acquired_at:
            findings.append({
                "check_category": "TIMELINE",
                "severity": "HIGH",
                "title": "Future Creation Timestamp Anomaly",
                "description": f"Embedded creation timestamp ({create_dt.isoformat()}) is after the recorded acquisition timestamp ({acquired_at.isoformat()}).",
                "supporting_observations": {
                    "embedded_timestamp": create_dt.isoformat(),
                    "acquisition_timestamp": acquired_at.isoformat()
                },
                "confidence": "HIGH",
                "recommendation": "Device clock was improperly set or metadata was modified artificially."
            })

    if not findings:
        findings.append({
            "check_category": "TIMELINE",
            "severity": "INFO",
            "title": "Timeline Baseline Established",
            "description": f"Acquisition timestamp recorded at {acquired_at.isoformat()}. No contradicting embedded timestamps found.",
            "confidence": "HIGH",
            "recommendation": "Maintain append-only custody logs."
        })

    return findings
