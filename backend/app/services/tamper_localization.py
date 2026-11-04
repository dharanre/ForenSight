import os
import json
import cv2
import numpy as np
from PIL import Image
from typing import Dict, Any, List, Optional
from app.services.merkle import generate_block_manifest, load_manifest
from app.services.manipulation import compare_perceptual_hashes, perform_ela

def localize_tampering(
    ref_file_path: str,
    cand_file_path: str,
    ref_manifest_path: str,
    output_heatmap_path: Optional[str] = None,
    output_ela_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Core Module C: Block-Based Tamper Localization.
    1. Loads reference manifest and generates candidate manifest.
    2. Identifies matching and differing blocks at byte-level.
    3. Aggregates contiguous differing byte ranges.
    4. Computes perceptual similarity metrics for images.
    5. Generates difference heatmap/mask if visual comparison is supported.
    """
    ref_manifest = load_manifest(ref_manifest_path)
    cand_manifest = generate_block_manifest(cand_file_path, block_size=ref_manifest["block_size"])

    ref_blocks = ref_manifest["blocks"]
    cand_blocks = cand_manifest["blocks"]

    total_blocks_to_compare = max(len(ref_blocks), len(cand_blocks))
    min_len = min(len(ref_blocks), len(cand_blocks))

    matching_count = 0
    differing_blocks = []

    for i in range(min_len):
        if ref_blocks[i]["sha256"] == cand_blocks[i]["sha256"]:
            matching_count += 1
        else:
            differing_blocks.append({
                "index": i,
                "offset_start": cand_blocks[i]["offset_start"],
                "offset_end": cand_blocks[i]["offset_end"],
                "length": cand_blocks[i]["length"]
            })

    # Account for size length mismatch (extra blocks are all differing)
    if len(cand_blocks) > min_len:
        for i in range(min_len, len(cand_blocks)):
            differing_blocks.append({
                "index": i,
                "offset_start": cand_blocks[i]["offset_start"],
                "offset_end": cand_blocks[i]["offset_end"],
                "length": cand_blocks[i]["length"]
            })
    elif len(ref_blocks) > min_len:
        for i in range(min_len, len(ref_blocks)):
            differing_blocks.append({
                "index": i,
                "offset_start": ref_blocks[i]["offset_start"],
                "offset_end": ref_blocks[i]["offset_end"],
                "length": ref_blocks[i]["length"]
            })

    differing_count = len(differing_blocks)
    matching_pct = round((matching_count / total_blocks_to_compare * 100.0), 2) if total_blocks_to_compare > 0 else 100.0
    differing_pct = round((differing_count / total_blocks_to_compare * 100.0), 2) if total_blocks_to_compare > 0 else 0.0

    # Aggregate contiguous byte ranges
    byte_ranges_diff = []
    if differing_blocks:
        cur_range = {
            "start": differing_blocks[0]["offset_start"],
            "end": differing_blocks[0]["offset_end"]
        }
        for b in differing_blocks[1:]:
            if b["offset_start"] == cur_range["end"]:
                cur_range["end"] = b["offset_end"]
            else:
                cur_range["length"] = cur_range["end"] - cur_range["start"]
                byte_ranges_diff.append(cur_range)
                cur_range = {
                    "start": b["offset_start"],
                    "end": b["offset_end"]
                }
        cur_range["length"] = cur_range["end"] - cur_range["start"]
        byte_ranges_diff.append(cur_range)

    # Image comparison & Visual Tamper Map
    perceptual_res = compare_perceptual_hashes(ref_file_path, cand_file_path)
    heatmap_generated = False

    if output_heatmap_path:
        try:
            ref_img = cv2.imread(ref_file_path)
            cand_img = cv2.imread(cand_file_path)

            if ref_img is not None and cand_img is not None:
                # Resize candidate to reference dimensions if mismatched for visualization
                if ref_img.shape != cand_img.shape:
                    cand_resized = cv2.resize(cand_img, (ref_img.shape[1], ref_img.shape[0]))
                else:
                    cand_resized = cand_img

                # Compute absolute pixel difference
                diff = cv2.absdiff(ref_img, cand_resized)
                gray_diff = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
                
                # Apply threshold and colormap for tamper heatmap
                _, thresh = cv2.threshold(gray_diff, 25, 255, cv2.THRESH_BINARY)
                heatmap = cv2.applyColorMap(gray_diff * 3, cv2.COLORMAP_JET)

                # Overlay heatmap onto candidate image with transparency
                overlay = cv2.addWeighted(cand_resized, 0.6, heatmap, 0.4, 0)
                
                # Draw red contours around changed regions
                contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                for c in contours:
                    if cv2.contourArea(c) > 50:
                        x, y, w, h = cv2.boundingRect(c)
                        cv2.rectangle(overlay, (x, y), (x + w, y + h), (0, 0, 255), 2)

                cv2.imwrite(output_heatmap_path, overlay)
                heatmap_generated = True
        except Exception:
            heatmap_generated = False

    # ELA on candidate if JPEG
    ela_res = None
    if output_ela_path and cand_file_path.lower().endswith((".jpg", ".jpeg")):
        ela_res = perform_ela(cand_file_path, output_ela_path)

    return {
        "total_blocks_compared": total_blocks_to_compare,
        "matching_blocks_count": matching_count,
        "matching_blocks_percentage": matching_pct,
        "differing_blocks_count": differing_count,
        "differing_blocks_percentage": differing_pct,
        "differing_blocks": differing_blocks[:100], # limit preview
        "byte_ranges_diff": byte_ranges_diff,
        "perceptual_hash_distance": perceptual_res.get("phash_hamming_distance"),
        "visual_similarity_percentage": perceptual_res.get("perceptual_similarity_percentage"),
        "tamper_heatmap_generated": heatmap_generated,
        "tamper_heatmap_path": output_heatmap_path if heatmap_generated else None,
        "ela_result_path": output_ela_path if (ela_res and ela_res.get("success")) else None,
        "candidate_merkle_root": cand_manifest["merkle_root"]
    }
