import os
import uuid
import json
from datetime import datetime, timezone
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, HRFlowable
from app.services.hashing import calculate_file_hashes

def generate_pdf_report(
    evidence_data: Dict[str, Any],
    findings: list,
    custody_events: list,
    verification_data: Dict[str, Any] = None,
    output_pdf_path: str = None
) -> Dict[str, Any]:
    """
    Core Module F: PDF Forensic Report Generation.
    Compiles full forensic acquisition, multi-hashes, Merkle root, blockchain status,
    tamper localization results, and Section 63(4) Bharatiya Sakshya Adhiniyam certificate template.
    Avoids circular hashing: PDF is compiled first, then hashed on disk.
    """
    report_id = f"REP-{uuid.uuid4().hex[:12].upper()}"
    
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a")
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569")
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=10,
        spaceAfter=6
    )
    mono_style = ParagraphStyle(
        "MonoText",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0f172a")
    )
    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155")
    )
    alert_style = ParagraphStyle(
        "AlertNotice",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#64748b")
    )

    story = []

    # Title Banner
    story.append(Paragraph("FORENSCAN DIGITAL FORENSIC ANALYSIS REPORT", title_style))
    story.append(Paragraph(f"Automated Tamper-Localization & ForenChain Integrity Audit | Report ID: {report_id}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceBefore=8, spaceAfter=12))

    # Evidence Summary Table
    story.append(Paragraph("1. EVIDENCE ACQUISITION & INTEGRITY SPECIFICATION", heading_style))
    
    summary_data = [
        [Paragraph("<b>Evidence ID:</b>", body_style), Paragraph(str(evidence_data.get("id")), mono_style),
         Paragraph("<b>Case ID:</b>", body_style), Paragraph(str(evidence_data.get("case_id")), mono_style)],
        [Paragraph("<b>Original Filename:</b>", body_style), Paragraph(str(evidence_data.get("original_filename")), body_style),
         Paragraph("<b>File Size:</b>", body_style), Paragraph(f"{evidence_data.get('file_size_bytes')} bytes", body_style)],
        [Paragraph("<b>Claimed Ext:</b>", body_style), Paragraph(str(evidence_data.get("claimed_extension")), mono_style),
         Paragraph("<b>Detected MIME:</b>", body_style), Paragraph(str(evidence_data.get("detected_mime_type")), mono_style)],
        [Paragraph("<b>Acquisition Date:</b>", body_style), Paragraph(str(evidence_data.get("acquired_at")), body_style),
         Paragraph("<b>Operator:</b>", body_style), Paragraph(str(evidence_data.get("acquisition_operator")), body_style)],
        [Paragraph("<b>SHA-256 Hash:</b>", body_style), Paragraph(str(evidence_data.get("sha256")), mono_style), "", ""],
        [Paragraph("<b>MD5 Hash:</b>", body_style), Paragraph(str(evidence_data.get("md5")), mono_style),
         Paragraph("<b>SHA-1 Hash:</b>", body_style), Paragraph(str(evidence_data.get("sha1")), mono_style)],
        [Paragraph("<b>Merkle Root:</b>", body_style), Paragraph(str(evidence_data.get("merkle_root")), mono_style),
         Paragraph("<b>Block Count:</b>", body_style), Paragraph(str(evidence_data.get("total_blocks")), mono_style)],
        [Paragraph("<b>Blockchain Status:</b>", body_style), Paragraph(f"<b>{evidence_data.get('anchoring_status')}</b>", body_style),
         Paragraph("<b>Tx Hash:</b>", body_style), Paragraph(str(evidence_data.get("blockchain_tx_hash") or "N/A"), mono_style)]
    ]

    t_summary = Table(summary_data, colWidths=[110, 160, 100, 170])
    t_summary.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("SPAN", (1, 4), (3, 4)), # Span SHA-256 across columns
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 10))

    # Forensic Findings Section
    story.append(Paragraph("2. FORENSIC ENGINE ANALYSIS FINDINGS", heading_style))
    if findings:
        findings_data = [
            [Paragraph("<b>Severity</b>", body_style),
             Paragraph("<b>Category</b>", body_style),
             Paragraph("<b>Observation Title</b>", body_style),
             Paragraph("<b>Description & Notes</b>", body_style)]
        ]
        for f in findings:
            f_severity = f.get("severity") if isinstance(f, dict) else getattr(f, "severity", "INFO")
            f_category = (f.get("category") or f.get("check_category")) if isinstance(f, dict) else getattr(f, "check_category", "FORENSICS")
            f_title = f.get("title") if isinstance(f, dict) else getattr(f, "title", "Observation")
            f_desc = f.get("description") if isinstance(f, dict) else getattr(f, "description", "")
            sev_color = "#ef4444" if f_severity in ["HIGH", "CRITICAL"] else "#f59e0b" if f_severity == "MEDIUM" else "#10b981"
            findings_data.append([
                Paragraph(f"<font color='{sev_color}'><b>{f_severity}</b></font>", mono_style),
                Paragraph(str(f_category or "FORENSICS"), mono_style),
                Paragraph(str(f_title), body_style),
                Paragraph(str(f_desc), body_style)
            ])
        t_find = Table(findings_data, colWidths=[70, 90, 150, 230])
        t_find.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t_find)
    else:
        story.append(Paragraph("No anomalous findings recorded during automated scan.", body_style))
    story.append(Spacer(1, 10))

    # Verification & Tamper Localization (if present)
    if verification_data:
        story.append(Paragraph("3. VERIFICATION & TAMPER-LOCALIZATION AUDIT", heading_style))
        vrf_table_data = [
            [Paragraph("<b>Candidate File:</b>", body_style), Paragraph(str(verification_data.get("candidate_filename")), body_style),
             Paragraph("<b>Integrity Result:</b>", body_style), Paragraph("<b>EXACT MATCH</b>" if verification_data.get("exact_match") else "<font color='#ef4444'><b>TAMPERING DETECTED</b></font>", body_style)],
            [Paragraph("<b>Matching Blocks:</b>", body_style), Paragraph(f"{verification_data.get('matching_blocks_count')} ({verification_data.get('matching_blocks_percentage')}%)", mono_style),
             Paragraph("<b>Differing Blocks:</b>", body_style), Paragraph(f"{verification_data.get('differing_blocks_count')} ({verification_data.get('differing_blocks_percentage')}%)", mono_style)],
            [Paragraph("<b>Visual Similarity:</b>", body_style), Paragraph(f"{verification_data.get('visual_similarity_percentage')}% (pHash Dist: {verification_data.get('perceptual_hash_distance')})", mono_style),
             Paragraph("<b>Diff Byte Ranges:</b>", body_style), Paragraph(f"{len(verification_data.get('byte_ranges_diff') or [])} distinct ranges", mono_style)]
        ]
        t_vrf = Table(vrf_table_data, colWidths=[110, 160, 100, 170])
        t_vrf.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t_vrf)
        story.append(Spacer(1, 10))

    # Chain of Custody History
    story.append(Paragraph("4. SECURE CHAIN OF CUSTODY LOG", heading_style))
    if custody_events:
        cus_data = [[
            Paragraph("<b>Timestamp (UTC)</b>", body_style),
            Paragraph("<b>Event Type</b>", body_style),
            Paragraph("<b>Actor</b>", body_style),
            Paragraph("<b>Record Hash (SHA-256)</b>", body_style)
        ]]
        for c in custody_events[:6]: # Show recent 6 events
            c_time = c.get("timestamp") or c.get("occurredAt") if isinstance(c, dict) else getattr(c, "timestamp", "")
            c_type = c.get("event_type") or c.get("eventType") if isinstance(c, dict) else getattr(c, "event_type", "")
            c_actor = c.get("actor") or c.get("actorName") if isinstance(c, dict) else getattr(c, "actor", "")
            c_hash = c.get("event_record_hash") or c.get("eventHash") if isinstance(c, dict) else getattr(c, "event_record_hash", "")
            cus_data.append([
                Paragraph(str(c_time)[:19], mono_style),
                Paragraph(str(c_type), mono_style),
                Paragraph(str(c_actor), body_style),
                Paragraph(str(c_hash)[:20] + "...", mono_style)
            ])
        t_cus = Table(cus_data, colWidths=[110, 140, 110, 180])
        t_cus.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(t_cus)
    story.append(Spacer(1, 12))

    # Certificate Template (Section 63(4) Bharatiya Sakshya Adhiniyam)
    story.append(Paragraph("5. CERTIFICATE UNDER SECTION 63(4) OF BHARATIYA SAKSHYA ADHINIYAM, 2023 (DRAFT TEMPLATE)", heading_style))
    cert_text = (
        "<b>CERTIFICATE RESPECTING ELECTRONIC EVIDENCE:</b><br/>"
        "1. This technical certificate is issued in respect of the electronic record identified herein, acquired under Case ID: "
        f"<b>{evidence_data.get('case_id')}</b>, Evidence ID: <b>{evidence_data.get('id')}</b>.<br/>"
        f"2. The cryptographic hash of the original electronic record was computed as <b>{evidence_data.get('sha256')}</b> using the SHA-256 algorithm.<br/>"
        "3. During the material period, the computer and acquisition systems were operating properly, and the cryptographic integrity of the digital evidence has been preserved in accordance with standard forensic practices.<br/>"
        "4. <i>Note: This document constitutes an automated forensic summary report and draft certificate. It requires independent review and physical endorsement by the designated forensic examiner/lawful authority.</i>"
    )
    story.append(Paragraph(cert_text, body_style))
    story.append(Spacer(1, 15))

    # Signature Fields
    sig_data = [
        [Paragraph("<b>Authorized Forensic Examiner Name:</b>", body_style), Paragraph("___________________________", mono_style)],
        [Paragraph("<b>Official Designation & Organization:</b>", body_style), Paragraph("___________________________", mono_style)],
        [Paragraph("<b>Place & Date:</b>", body_style), Paragraph("___________________________", mono_style)],
        [Paragraph("<b>Signature:</b>", body_style), Paragraph("___________________________", mono_style)]
    ]
    t_sig = Table(sig_data, colWidths=[220, 320])
    t_sig.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(t_sig)

    # Build Document
    doc.build(story)

    # Hash the finalized report bytes
    report_hashes = calculate_file_hashes(output_pdf_path)

    return {
        "report_id": report_id,
        "report_path": output_pdf_path,
        "report_sha256": report_hashes["sha256"],
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
