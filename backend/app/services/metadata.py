import os
import zipfile
import xml.etree.ElementTree as ET
from typing import Dict, Any, List
from PIL import Image, ExifTags
import pypdf

# Common editing software strings to flag
SUSPICIOUS_SOFTWARE = [
    "photoshop", "gimp", "canva", "pixlr", "affinity", "lightroom", "paint.net",
    "coreldraw", "snapseed", "fotor", "facetune", "adobe illustrator", "acrobat distiller"
]

def extract_image_metadata(file_path: str) -> Dict[str, Any]:
    metadata = {}
    software_found = []
    
    try:
        with Image.open(file_path) as img:
            metadata["format"] = img.format
            metadata["mode"] = img.mode
            metadata["dimensions"] = f"{img.width}x{img.height}"
            
            exif = img.getexif()
            if exif:
                for tag_id, value in exif.items():
                    tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                    # Convert bytes to string or repr
                    if isinstance(value, bytes):
                        val_str = value.decode("utf-8", errors="replace")
                    else:
                        val_str = str(value)
                    metadata[tag_name] = val_str

                    if tag_name.lower() in ["software", "processingsoftware", "make", "model"]:
                        for s in SUSPICIOUS_SOFTWARE:
                            if s in val_str.lower():
                                software_found.append(val_str)
                                
            # Check GPS Info
            gps_info = exif.get_ifd(ExifTags.IFD.GPSInfo) if hasattr(ExifTags, "IFD") else None
            if gps_info:
                metadata["gps_present"] = True
                gps_dict = {}
                for g_id, g_val in gps_info.items():
                    g_name = ExifTags.GPSTAGS.get(g_id, str(g_id))
                    gps_dict[g_name] = str(g_val)
                metadata["gps_details"] = gps_dict
            else:
                metadata["gps_present"] = False

    except Exception as e:
        metadata["error"] = f"Image metadata extraction failed: {str(e)}"

    return {
        "metadata": metadata,
        "software_found": list(set(software_found))
    }

def extract_pdf_metadata(file_path: str) -> Dict[str, Any]:
    metadata = {}
    software_found = []

    try:
        reader = pypdf.PdfReader(file_path)
        metadata["num_pages"] = len(reader.pages)
        if reader.metadata:
            for key, val in reader.metadata.items():
                clean_key = key.lstrip("/")
                val_str = str(val) if val is not None else ""
                metadata[clean_key] = val_str

                if clean_key.lower() in ["producer", "creator", "author"]:
                    for s in SUSPICIOUS_SOFTWARE:
                        if s in val_str.lower():
                            software_found.append(val_str)
    except Exception as e:
        metadata["error"] = f"PDF metadata extraction failed: {str(e)}"

    return {
        "metadata": metadata,
        "software_found": list(set(software_found))
    }

def extract_office_metadata(file_path: str) -> Dict[str, Any]:
    metadata = {}
    software_found = []

    try:
        if zipfile.is_zipfile(file_path):
            with zipfile.ZipFile(file_path, "r") as z:
                # Open core.xml
                core_xml = "docProps/core.xml"
                if core_xml in z.namelist():
                    xml_data = z.read(core_xml)
                    root = ET.fromstring(xml_data)
                    for elem in root.iter():
                        tag = elem.tag.split("}")[-1] if "}" in elem.tag else elem.tag
                        if elem.text:
                            metadata[tag] = elem.text.strip()
                            if tag.lower() in ["creator", "lastmodifiedby"]:
                                for s in SUSPICIOUS_SOFTWARE:
                                    if s in elem.text.lower():
                                        software_found.append(elem.text.strip())
                # Open app.xml
                app_xml = "docProps/app.xml"
                if app_xml in z.namelist():
                    xml_data = z.read(app_xml)
                    root = ET.fromstring(xml_data)
                    for elem in root.iter():
                        tag = elem.tag.split("}")[-1] if "}" in elem.tag else elem.tag
                        if elem.text:
                            metadata[f"app_{tag}"] = elem.text.strip()
    except Exception as e:
        metadata["error"] = f"Office metadata extraction failed: {str(e)}"

    return {
        "metadata": metadata,
        "software_found": list(set(software_found))
    }

def extract_metadata_and_findings(file_path: str, detected_mime: str) -> Dict[str, Any]:
    """
    Performs Check 3: Metadata Analysis.
    Extracts camera info, timestamps, GPS, software tags, document authors, and flags editing tools.
    """
    meta_result = {"metadata": {}, "software_found": []}
    
    if detected_mime in ["image/jpeg", "image/png", "image/webp", "image/bmp"]:
        meta_result = extract_image_metadata(file_path)
    elif detected_mime == "application/pdf":
        meta_result = extract_pdf_metadata(file_path)
    elif "openxmlformats" in detected_mime or detected_mime == "application/zip":
        meta_result = extract_office_metadata(file_path)

    metadata = meta_result["metadata"]
    software_found = meta_result["software_found"]
    findings = []

    if software_found:
        findings.append({
            "check_category": "METADATA",
            "severity": "MEDIUM",
            "title": "Editing Software Metadata Tag Detected",
            "description": f"File metadata references known image/document editing software: {', '.join(software_found)}.",
            "supporting_observations": {
                "detected_software_tags": software_found,
                "metadata_snapshot": metadata
            },
            "confidence": "HIGH",
            "recommendation": "Review manipulation indicators (such as ELA or block difference). Metadata tags alone indicate processing, not necessarily malicious tampering."
        })
    elif metadata:
        findings.append({
            "check_category": "METADATA",
            "severity": "INFO",
            "title": "Metadata Extracted Successfully",
            "description": f"Extracted {len(metadata)} metadata fields. No explicit editing software tags detected.",
            "confidence": "HIGH",
            "recommendation": "Cross-reference extracted timestamps with custody timeline."
        })
    else:
        findings.append({
            "check_category": "METADATA",
            "severity": "LOW",
            "title": "Metadata Not Available / Stripped",
            "description": "No EXIF or document metadata fields were found in the file.",
            "confidence": "MEDIUM",
            "recommendation": "File may have had metadata scrubbed or was created without embedded metadata."
        })

    return {
        "metadata": metadata,
        "findings": findings
    }
