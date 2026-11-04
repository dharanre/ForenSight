import os
from PIL import Image, ImageDraw

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "..", "demo_fixtures")
os.makedirs(FIXTURES_DIR, exist_ok=True)

def generate_demo_fixtures():
    print("Generating reproducible demonstration fixtures...")

    # 1. Reference Scene Photograph (Clean)
    ref_img_path = os.path.join(FIXTURES_DIR, "demo_incident_photo_reference.jpg")
    img = Image.new("RGB", (400, 300), color=(50, 70, 95))
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 350, 250], fill=(70, 100, 130), outline=(200, 200, 200), width=3)
    draw.text((70, 70), "FORENSCAN EVIDENCE TEST VECTOR", fill=(255, 255, 255))
    img.save(ref_img_path, "JPEG", quality=95)
    print(f"Created: {ref_img_path}")

    # 2. Tampered Incident Photograph (With Spliced Red Object)
    cand_img_path = os.path.join(FIXTURES_DIR, "demo_incident_photo_tampered.jpg")
    img_tampered = img.copy()
    draw_tampered = ImageDraw.Draw(img_tampered)
    draw_tampered.rectangle([180, 140, 260, 210], fill=(220, 20, 60), outline=(255, 255, 0), width=2)
    draw_tampered.text((185, 170), "TAMPERED", fill=(255, 255, 255))
    img_tampered.save(cand_img_path, "JPEG", quality=95)
    print(f"Created: {cand_img_path}")

    # 3. Spoofed Extension (Harmless ZIP archive named as .pdf)
    spoofed_path = os.path.join(FIXTURES_DIR, "demo_spoofed_extension.pdf")
    with open(spoofed_path, "wb") as f:
        # Standard ZIP header followed by harmless text
        f.write(b"PK\x03\x04\x14\x00\x00\x00\x08\x00FakeZipArchiveClaimingToBePDFDocument")
    print(f"Created: {spoofed_path}")

    # 4. Trailing Bytes Anomaly (JPEG with hidden text appended after FF D9 EOF)
    trailing_path = os.path.join(FIXTURES_DIR, "demo_trailing_payload.jpg")
    with open(ref_img_path, "rb") as f_in:
        orig_bytes = f_in.read()
    with open(trailing_path, "wb") as f_out:
        f_out.write(orig_bytes)
        f_out.write(b"\n--- HIDDEN STEGANOGRAPHIC EMBEDDED STRING (DEMO ONLY) ---")
    print(f"Created: {trailing_path}")

    print("All demo fixtures generated successfully!")

if __name__ == "__main__":
    generate_demo_fixtures()
