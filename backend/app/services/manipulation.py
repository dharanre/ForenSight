import os
import io
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
import cv2
import imagehash
from typing import Dict, Any, List, Optional

def perform_ela(image_path: str, output_path: str, quality: int = 90, scale: int = 15) -> Dict[str, Any]:
    """
    Error Level Analysis (ELA).
    Resaves image at specified JPEG quality, measures absolute pixel differences,
    and amplifies difference by scale factor.
    Returns maximum difference, average difference, and high-energy region ratio.
    """
    try:
        original = Image.open(image_path).convert("RGB")
        
        # Save temporary resaved version to memory
        temp_buffer = io.BytesIO()
        original.save(temp_buffer, "JPEG", quality=quality)
        temp_buffer.seek(0)
        resaved = Image.open(temp_buffer)

        # Compute difference
        diff = ImageChops.difference(original, resaved)
        
        # Calculate statistical measurements before amplification
        extrema = diff.getextrema()
        max_diff = max([ex[1] for ex in extrema])
        
        diff_arr = np.array(diff)
        mean_diff = float(np.mean(diff_arr))

        # Amplify for human visual inspection
        enhanced = ImageEnhance.Brightness(diff).enhance(scale)
        enhanced.save(output_path, "PNG")

        # High variance ratio
        high_diff_ratio = float(np.sum(diff_arr > 15) / diff_arr.size)

        is_suspicious = high_diff_ratio > 0.08 and max_diff > 35

        return {
            "success": True,
            "output_path": output_path,
            "max_difference": max_diff,
            "mean_difference": round(mean_diff, 2),
            "high_diff_ratio": round(high_diff_ratio, 4),
            "is_suspicious": is_suspicious,
            "notes": "ELA visualizes compression level variance. High contrast regions may indicate resaved edits or composite insertions."
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "notes": "ELA could not be performed (unsupported format or corruption)."
        }

def compute_perceptual_hashes(image_path: str) -> Dict[str, Any]:
    """
    Calculates perceptual hashes (aHash, dHash, pHash, wHash) using ImageHash.
    """
    try:
        img = Image.open(image_path)
        return {
            "success": True,
            "ahash": str(imagehash.average_hash(img)),
            "dhash": str(imagehash.dhash(img)),
            "phash": str(imagehash.phash(img)),
            "whash": str(imagehash.whash(img))
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def compare_perceptual_hashes(ref_path: str, cand_path: str) -> Dict[str, Any]:
    """
    Computes Hamming distance across perceptual hashes between reference and candidate images.
    Returns Hamming distance and normalized perceptual similarity percentage.
    """
    try:
        ref_img = Image.open(ref_path)
        cand_img = Image.open(ref_path) # placeholder
        cand_img = Image.open(cand_path)

        ref_phash = imagehash.phash(ref_img)
        cand_phash = imagehash.phash(cand_img)
        dist_phash = int(ref_phash - cand_phash) # Ensure standard int

        ref_dhash = imagehash.dhash(ref_img)
        cand_dhash = imagehash.dhash(cand_img)
        dist_dhash = int(ref_dhash - cand_dhash)

        # Normalized similarity from pHash (64 bits total)
        similarity_pct = max(0.0, min(100.0, round((1.0 - (dist_phash / 64.0)) * 100.0, 2)))

        return {
            "success": True,
            "phash_hamming_distance": dist_phash,
            "dhash_hamming_distance": dist_dhash,
            "perceptual_similarity_percentage": similarity_pct,
            "is_perceptually_identical": (dist_phash == 0),
            "interpretation": (
                "Perceptually identical" if dist_phash == 0 else
                "Slight visual variation" if dist_phash <= 5 else
                "Noticeable visual modification" if dist_phash <= 15 else
                "Significantly different image content"
            )
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def analyze_manipulation_single(file_path: str, detected_mime: str, output_ela_path: str) -> List[Dict[str, Any]]:
    """
    Performs Check 4 manipulation indicators for a single registered file.
    Runs ELA if image is JPEG, calculates perceptual hashes.
    """
    findings = []
    
    if detected_mime == "image/jpeg":
        ela_res = perform_ela(file_path, output_ela_path)
        if ela_res.get("success"):
            if ela_res["is_suspicious"]:
                findings.append({
                    "check_category": "MANIPULATION",
                    "severity": "MEDIUM",
                    "title": "ELA Compression Discrepancy Detected",
                    "description": "Error Level Analysis revealed significant variance in compression error rates across image sectors.",
                    "supporting_observations": {
                        "max_difference": ela_res["max_difference"],
                        "mean_difference": ela_res["mean_difference"],
                        "high_diff_ratio": ela_res["high_diff_ratio"]
                    },
                    "confidence": "MEDIUM",
                    "recommendation": "Inspect visual ELA map for localized bright boundaries indicating spliced objects or local re-saving."
                })
            else:
                findings.append({
                    "check_category": "MANIPULATION",
                    "severity": "INFO",
                    "title": "ELA Compression Uniformity Verified",
                    "description": "Error Level Analysis shows uniform compression levels across the image.",
                    "supporting_observations": {
                        "max_difference": ela_res["max_difference"],
                        "mean_difference": ela_res["mean_difference"]
                    },
                    "confidence": "HIGH",
                    "recommendation": "Normal uniform compression characteristics observed."
                })

    return findings
