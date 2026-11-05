# VELLORE INSTITUTE OF TECHNOLOGY, CHENNAI
### School of Computer Science and Engineering (SCOPE)
### Course Project Report — Forensic Analytics (CSE4074)

---

# ForenSight — Cryptographically Verifiable Digital Forensics Investigation, Tamper Localization & Evidence Management Platform

#### A Comprehensive, Court-Admissible Forensic Framework Integrating Deterministic Merkle-Tree Byte-Level Tamper Localization, Multi-Algorithm Cryptographic Hashing, 5-Tier Diagnostic Heuristics, Append-Only Custody Chains, and NoSQL Architecture

---

### Academic & Student Credentials

| Attribute | Details |
| :--- | :--- |
| **Course Name** | Forensic Analytics |
| **Course Code** | CSE4074 |
| **Academic Semester** | Fall Semester 2026–27 |
| **Student Investigator** | **Giridharan R E** |
| **Register Number / Roll No** | **23MIA1128** |
| **School** | School of Computer Science and Engineering (SCOPE) |
| **Institution** | Vellore Institute of Technology (VIT), Chennai Campus |
| **Faculty / Course Professor** | Dr. S. Johanan Joyselin |
| **Submission Date** | November 2026 |

---

## Certificate of Authenticity & Originality

This is to certify that the project report entitled **"ForenSight — Cryptographically Verifiable Digital Forensics Investigation, Tamper Localization & Evidence Management Platform"** submitted by **Giridharan R E (Reg. No: 23MIA1128)** in partial fulfillment of the academic requirements for the course **Forensic Analytics (CSE4074)** at the School of Computer Science and Engineering (SCOPE), Vellore Institute of Technology, Chennai, is an authentic record of the investigative and software development work performed.

**Student Investigator:**  
Giridharan R E (23MIA1128)  
Department of Computer Science and Engineering  
Vellore Institute of Technology, Chennai  

---

## Table of Contents

1. [Abstract & Executive Summary](#1-abstract--executive-summary)
2. [Problem Statement & Research Motivation](#2-problem-statement--research-motivation)
3. [Legal, Regulatory & Evidentiary Admissibility Frameworks](#3-legal-regulatory--evidentiary-admissibility-frameworks)
   - 3.1 ISO/IEC 27037:2012 Principles
   - 3.2 Bharatiya Sakshya Adhiniyam, 2023 (Section 63(4))
   - 3.3 US Federal Rules of Evidence (Rule 902(13/14))
4. [System Architecture & Full-Stack Implementation](#4-system-architecture--full-stack-implementation)
   - 4.1 Tiered Layer Topology
   - 4.2 Technology Stack
5. [Forensic Analytics & Algorithmic Methodologies](#5-forensic-analytics--algorithmic-methodologies)
   - 5.1 Single-Pass Stream-Buffered Multi-Hashing ($O(1)$ RAM)
   - 5.2 Deterministic 4096-Byte Merkle Tree Slicing & Tamper Localization
   - 5.3 Five-Tier Forensic Diagnostic Core
   - 5.4 Append-Only Hash-Chained Chain of Custody
   - 5.5 Autonomous 30-Second Storage Watchdog Daemon
   - 5.6 Automated Statutory Admissibility Report Generator
6. [Database Systems Architecture & Query Optimization](#6-database-systems-architecture--query-optimization)
   - 6.1 Eight Specialized BSON Collections
   - 6.2 Embedding vs. Referencing Rationale
   - 6.3 Compound Index Tuning & `.explain()` Query Plan Analysis
   - 6.4 Multi-Stage Real-Time Aggregation Pipelines
   - 6.5 Dual-Engine Database Driver (Live MongoDB + In-Memory Disk Sync)
7. [Experimental Results, Verification Walkthrough & Test Suite](#7-experimental-results-verification-walkthrough--test-suite)
   - 7.1 Automated Unit & Integration Testing (13/13 Tests Passing)
   - 7.2 Experimental Benchmark Scenarios
8. [Comparative Analysis against Industry Standard Tools](#8-comparative-analysis-against-industry-standard-tools)
9. [Conclusion & Future Work](#9-conclusion--future-work)
10. [References](#10-references)

---

## 1. Abstract & Executive Summary

In digital criminal investigations, preserving the cryptographic integrity of seized electronic evidence is the prerequisite for court admissibility. Conventional forensic tools rely primarily on single full-file cryptographic hash digests (e.g., standard SHA-256 or MD5). While a global hash determines whether a bitstream has been modified, it acts purely as a binary indicator: it fails to reveal **where**, **how much**, or **what specific byte sectors** have been manipulated. Furthermore, digital artifacts exhibit extreme structural polymorphism (ranging from JPEG EXIF tags and GPS telemetry to PDF cross-reference tables and binary PE headers), making rigid relational database models inefficient and prone to schema sparsity.

**ForenSight** is an enterprise-grade Digital Forensics Investigation and Evidence Management Platform designed and engineered to overcome these challenges. Developed for **Forensic Analytics (CSE4074)**, ForenSight introduces:
1. **Deterministic 4096-Byte Merkle Tree Slicing:** Partitions evidence files into 4KB blocks, generates hierarchical leaf digests, and mathematically pinpoints the exact byte ranges $[i \times 4096, (i+1) \times 4096 - 1]$ of tampering.
2. **Stream-Buffered Multi-Hashing:** Simultaneously extracts MD5, SHA-1, and SHA-256 using 64 KB memory-buffered streams with strict $O(1)$ RAM complexity, preventing Out-of-Memory crashes on multi-gigabyte forensic images.
3. **Five-Tier Autonomous Diagnostic Engine:** Performs cross-hash divergence checks, binary magic byte extension spoofing analysis, EXIF/GPS telematics extraction, Error Level Analysis (ELA) recompression delta heatmaps via OpenCV, and temporal paradox detection (modifications preceding creation).
4. **Append-Only Cryptographic Custody Ledger:** Employs SHA-256 parent-child hash chaining to enforce tamper-evident evidence movement.
5. **NoSQL MongoDB Storage Architecture:** Leverages 8 specialized BSON collections with compound indexing, eliminating memory-sort penalties ($O(\log N)$ retrieval), verified through live `.explain("executionStats")` plans.
6. **Statutory Admissibility Compliance:** Automatically compiles legal certificates satisfying **Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023 (BSA)** and **ISO/IEC 27037:2012**.

---

## 2. Problem Statement & Research Motivation

Contemporary digital forensics laboratories face three critical technical bottlenecks:

### 2.1 The "Binary Hash" Inadequacy
Cryptographic hashing functions (such as SHA-256) exhibit the **avalanche effect**: altering a single bit in a 10 GB disk image completely randomizes the output hash digest. An investigator examining a candidate copy against a seized original can determine that the hashes do not match, but has no automated mechanism to determine:
* Which physical byte ranges were modified.
* Whether the alteration was a malicious content insertion or an innocent file system timestamp touch.
* What proportion of the evidence remains intact and verifiable.

### 2.2 Forensic Out-of-Memory (OOM) Fragility
Many open-source and script-based forensic intake utilities read entire files into system memory (`f.read()`) to compute digests. When dealing with raw partition captures, forensic virtual machine images (.vmdk), or surveillance video archives, this triggers severe memory exhaustion, crashing analysis pipelines during high-priority evidence intake.

### 2.3 Polymorphic Evidence vs. Rigid Relational Schemas
Seized evidence includes heterogeneous formats:
* Digital images with camera metadata, shutter speed, lens models, and decimal GPS coordinates.
* Office documents and PDFs containing revision histories and author stamps.
* Network packet captures (.pcap) and volatile memory dumps (.raw, .dmp).
Mapping these into normalized Relational Database Management Systems (RDBMS) requires either dozens of sparse, nullable tables linked by multi-table JOINs, or un-indexed JSON strings that inhibit high-speed indexing and audit compliance.

---

## 3. Legal, Regulatory & Evidentiary Admissibility Frameworks

ForenSight was architected to strictly comply with international and domestic forensic and evidentiary jurisprudence:

```
+-----------------------------------------------------------------------------------+
|                        EVIDENTIARY STANDARDS COMPLIANCE                           |
+-----------------------------------------------------------------------------------+
|  1. ISO/IEC 27037:2012      - Digital Evidence Handling, Invariance & Auditability|
|  2. NIST SP 800-86          - Forensic Techniques in Computer Security Incident   |
|  3. RFC 3227                - Order of Volatility Guidelines                      |
|  4. BSA 2023 Sec 63(4)      - Admissibility of Electronic Records (India)         |
|  5. US FRE Rule 902(13/14)  - Self-Authenticating Electronic Data (United States) |
+-----------------------------------------------------------------------------------+
```

### 3.1 ISO/IEC 27037:2012 Tenets
ForenSight enforces the four foundational principles of digital evidence handling:
1. **Invariance:** Digital evidence bitstreams are sealed upon intake in read-only storage directories (`storage/evidence/`).
2. **Auditability:** Every system access, state transition, and custody handover is permanently recorded in an append-only audit trail.
3. **Repeatability:** Independent examiners using standard CLI cryptographic binaries (`sha256sum`, `md5sum`) obtain identical mathematical values.
4. **Justification:** Every automated diagnostic observation is separated from investigator conclusions with explicit severity and confidence markers.

### 3.2 Bharatiya Sakshya Adhiniyam (BSA), 2023 — Section 63(4)
In India, the Bharatiya Sakshya Adhiniyam, 2023 superseded the Indian Evidence Act, 1872. Section 63(4) governs the admissibility of electronic records (previously Section 65B). ForenSight generates court-admissible PDF certificates that:
- Affix original cryptographic digests (MD5, SHA-1, SHA-256) and Merkle root anchors.
- Certify the uninterrupted, normal operation of the computer system and storage repository during acquisition and processing.
- Include the examiner’s identity, official designation, organization, and timestamped digital signature declarations.

---

## 4. System Architecture & Full-Stack Implementation

ForenSight is structured into three decoupled, high-performance tiers:

```
+-----------------------------------------------------------------------------------+
|                         PRESENTATION TIER (React 19 + Vite)                       |
|   15 Interactive Views: /workspace, /cases, /evidence, /verify, /analysis, etc.   |
|   Tailwind CSS v4 • Recharts Telemetry • Lucide Icons • Real-Time SSE Listeners   |
+-----------------------------------------+-----------------------------------------+
                                          | HTTP REST APIs + Server-Sent Events (SSE)
+-----------------------------------------v-----------------------------------------+
|                        APPLICATION & FORENSIC TIER (FastAPI)                      |
|   Acquisition Streamer • Merkle Slicer • 5-Check Diagnostic Core • Watchdog       |
|   ReportLab PDF Engine • OpenCV Image Analyzer • Pydantic Schema Validation       |
+-----------------------------------------+-----------------------------------------+
                                          | Native BSON Driver / PyMongo
+-----------------------------------------v-----------------------------------------+
|                     DATA PERSISTENCE & STORAGE TIER (MongoDB)                     |
|   MongoDB 7.0 (WiredTiger Engine) with 8 BSON Collections & Compound Indexes      |
|   Dual-Engine Fallback: In-Memory JSON-Synced Engine (Zero-Config Portability)   |
|   Storage Vault: /storage/evidence, /manifests, /findings, /reports               |
+-----------------------------------------------------------------------------------+
```

### 4.1 Technology Stack Details
* **Frontend:** React 19, TypeScript 5.6+, Vite 8, Tailwind CSS v4, Axios, Lucide React, Recharts.
* **Backend:** FastAPI (Asynchronous Python 3.11+), Uvicorn ASGI Server, Pydantic v2.
* **Forensic Analytics:** OpenCV (headless), Pillow (PIL), ImageHash, PyPDF, SciPy, NumPy, ReportLab.
* **Database:** MongoDB 7.0 WiredTiger Storage Engine, PyMongo, custom dual-mode in-memory resilience engine.
* **Testing:** Pytest (13 test suites covering all cryptographic, diagnostic, and query plan operations).

---

## 5. Forensic Analytics & Algorithmic Methodologies

### 5.1 Single-Pass Stream-Buffered Multi-Hashing ($O(1)$ RAM Complexity)
To prevent Out-Of-Memory exceptions on large seized disk images, ForenSight reads the file in fixed 64 KB chunks, feeding identical data blocks into three independent hashing engines concurrently:

$$\text{Chunk Size} = 65,536 \text{ bytes (64 KiB)}$$

```python
hasher_md5 = hashlib.md5()
hasher_sha1 = hashlib.sha1()
hasher_sha256 = hashlib.sha256()

with open(file_path, "rb") as f:
    while chunk := f.read(65536):
        hasher_md5.update(chunk)
        hasher_sha1.update(chunk)
        hasher_sha256.update(chunk)
```
* **Time Complexity:** $\mathcal{O}(N)$, where $N$ is total file length.
* **Space Complexity:** $\mathcal{O}(1)$ memory consumption (capped at 64 KB RAM regardless of file size).
* **Cryptographic Security:** Guarded against MD5 and SHA-1 collision attacks by requiring all three digests to match baseline intake values simultaneously.

---

### 5.2 Deterministic 4096-Byte Merkle Tree Slicing & Tamper Localization

To solve the binary hash limitation, ForenSight partitions the bitstream into sequential 4096-byte blocks:

$$B = \{B_0, B_1, B_2, \dots, B_{k-1}\} \quad \text{where} \quad |B_i| = 4096 \text{ bytes}$$

#### Mathematical Formulation:
1. **Leaf Hash Generation:** For each block $i$:
   $$H_{0, i} = \text{SHA-256}(B_i)$$
2. **Pairwise Tree Reduction:** For each level $l$:
   $$H_{l+1, j} = \text{SHA-256}(H_{l, 2j} \parallel H_{l, 2j+1})$$
   *(If a level has an odd number of nodes, the trailing node is promoted or hashed with itself).*
3. **Merkle Root:** The single 32-byte top-level hash $R_{\text{Merkle}}$.

```
                          [ Merkle Root ]
                             /        \
                     [ H_01 ]          [ H_23 ]
                     /      \          /      \
                  [ H_0 ]   [ H_1 ]  [ H_2 ]  [ H_3 ]
                  (Block0)  (Block1) (Block2) (Block3)
                  [4096 B]  [4096 B]  [4096 B]  [4096 B]
```

#### Byte-Level Tamper Localization Algorithm:
When verifying a suspect candidate file against the baseline manifest:
1. The candidate bitstream is sliced into 4096-byte blocks and hashed: $\{H_{\text{cand}, i}\}$.
2. The system calculates the set of differing blocks:
   $$\text{DiffBlocks} = \{ i \mid H_{\text{cand}, i} \neq H_{\text{ref}, i} \}$$
3. Each modified block index $i$ corresponds directly to the physical byte boundary:
   $$\text{Byte Offset Range} = [i \times 4096, \; (i + 1) \times 4096 - 1]$$
4. Contiguous differing blocks are merged into continuous modified byte intervals, providing exact physical offsets for courtroom testimony and visual localization.

---

### 5.3 Five-Tier Forensic Diagnostic Core

Every registered piece of evidence undergoes automated inspection across five specialized domains:

```
+-----------------------------------------------------------------------------------+
|                        5-TIER FORENSIC DIAGNOSTIC PIPELINE                        |
+-------------------+---------------------------------------------------------------+
| Check Category    | Analytical Procedure & Objective                              |
+-------------------+---------------------------------------------------------------+
| 1. Multi-Hashing  | MD5, SHA-1, SHA-256 cross-algorithm divergence & collision   |
| 2. Magic Bytes    | Leading binary signature vs claimed file extension analysis   |
| 3. Metadata/EXIF  | Camera model, lens, GPS coordinates, author software parsing  |
| 4. ELA & Heatmap  | Error Level Analysis (90% Q, 15x scale) with OpenCV Jet colormap|
| 5. Timeline Rules | Temporal paradox detection (modified before creation, future) |
+-------------------+---------------------------------------------------------------+
```

#### Detailed Diagnostic Breakdown:

* **Check 1: Cryptographic Divergence & Collision Check:**  
  Detects accidental bit rot, silent disk decay, or deliberate collision manipulation.

* **Check 2: Binary File Identity & Magic Byte Verification:**  
  Cybercriminals frequently mask malicious payloads by changing file extensions (e.g., disguising an executable malware dropper as `report.pdf`). ForenSight inspects raw leading bytes:
  * JPEG: `FF D8 FF`
  * PNG: `89 50 4E 47 0D 0A 1A 0A`
  * PDF: `25 50 44 46` (`%PDF`)
  * ZIP / Office OpenXML: `50 4B 03 04` (`PK..`)
  * Windows PE: `4D 5A` (`MZ`)
  If the detected magic bytes conflict with the extension, a **CRITICAL Severity finding (`MAGIC_BYTES_MISMATCH`)** is flagged.

* **Check 3: EXIF, GPS Decimal Coordinates & Author Software Extraction:**  
  Parses EXIF IFD structures using Pillow. Extracts camera hardware serials, exposure settings, ISO values, and converts GPS coordinates to decimal degrees ($DD = D + \frac{M}{60} + \frac{S}{3600}$). Inspects PDF and Office XML dictionaries for traces of editing suites (e.g., Photoshop, Canva, GIMP).

* **Check 4: Error Level Analysis (ELA) & Image Manipulation Heatmaps:**  
  JPEG compression operates in $8 \times 8$ pixel grids through Discrete Cosine Transforms (DCT). When an image is modified (spliced, cloned, or brushed), the edited region exhibits a different compression error rate:
  1. Recompresses the candidate image at 90% quality: $I_{\text{recomp}}$.
  2. Measures absolute pixel difference: $\Delta(x, y) = |I_{\text{orig}}(x, y) - I_{\text{recomp}}(x, y)|$.
  3. Amplifies the delta matrix by a factor of 15: $\text{Enhanced} = \Delta \times 15$.
  4. Computes the High-Difference Ratio:
     $$\text{high\_diff\_ratio} = \frac{\sum_{(x,y)} [\Delta(x, y) > 15]}{\text{Total Pixels}}$$
  5. If $\text{high\_diff\_ratio} > 0.08$ and $\max(\Delta) > 35$, the artifact is flagged as **`SUSPICIOUS (MANIPULATION)`**.
  6. Renders an OpenCV false-color heatmap overlay (`cv2.COLORMAP_JET`) with red bounding contours around edited sectors.

* **Check 5: Temporal Paradox & Inversion Detection:**  
  Analyzes internal document creation dates against file system metadata:
  * Flags inverted timestamps where `Last Modified` precedes `Created At`.
  * Flags future-dated timestamps relative to the intake machine's UTC clock.
  * Identifies discrepancies between camera shutter EXIF time and file creation timestamps.

---

### 5.4 Append-Only Hash-Chained Chain of Custody

Chain of custody is the legal backbone of evidence integrity. ForenSight models every evidence transfer as an immutable cryptographic block:

For custody event $E_k$:
$$\text{Payload}_k = \text{CanonicalJSON}(E_k.\text{evidenceId}, E_k.\text{action}, E_k.\text{fromCustodian}, E_k.\text{toCustodian}, E_k.\text{timestamp}, E_k.\text{reason})$$
$$\text{EventHash}_k = \text{SHA-256}(\text{EventHash}_{k-1} \parallel \text{Payload}_k)$$

Where $\text{EventHash}_0 = \text{SHA-256}(\text{"00000000000000000000000000000000"})$ (Genesis Node).

**Tamper Detection Guarantee:**  
If any past record is maliciously modified or deleted from the database, recalculating the hash chain immediately breaks at that node:
$$\text{CalculatedHash}_k \neq \text{StoredHash}_k$$
The platform immediately displays a **Custody Chain Compromised** alert, identifying the exact corrupted record.

---

### 5.5 Autonomous 30-Second Storage Watchdog Daemon
To protect against out-of-band disk modification (e.g., an attacker modifying files directly on the underlying server disk), ForenSight runs an asynchronous background daemon (`app/services/watchdog.py`):
* Audits all physical evidence files in `storage/evidence/` every 30 seconds.
* Recomputes SHA-256 digests and validates them against the MongoDB baseline.
* Instantly updates `integrity_status = "COMPROMISED"` and pushes a real-time alert to connected examiner dashboards via **Server-Sent Events (SSE)**.

---

### 5.6 Automated Statutory Admissibility Report Generator
The platform compiles all case metadata, cryptographic baseline hashes, Merkle roots, diagnostic findings, and chain-of-custody transfer logs into court-admissible PDF reports via ReportLab, fulfilling **Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023**.

---

## 6. Database Systems Architecture & Query Optimization

ForenSight utilizes **MongoDB (NoSQL Document Store)** as its primary database, specifically designed to handle polymorphic forensic metadata.

```
+-----------------------------------------------------------------------------------+
|                        MONGODB NOSQL DATA MODEL SCHEMA                            |
+-----------------------------------------------------------------------------------+
| cases            : Master docket info, priority, lead investigator, status        |
| evidence         : Bitstream telemetry, multi-hashes, embedded Merkle blocks      |
| custodyEvents    : Append-only custody transactions with parent-child SHA-256     |
| analysisJobs     : Diagnostic execution tracking and performance metrics          |
| findings         : Diagnostic anomalies, ELA results, severity ratings            |
| auditLogs        : Administrative action trail (append-only)                      |
| watchdogAudits   : Logs of continuous 30-second storage integrity sweeps          |
| users            : Forensic examiner credentials, roles, and public keys          |
+-----------------------------------------------------------------------------------+
```

### 6.1 Embedding vs. Referencing Rationale
1. **Embedded Subdocuments:** Merkle block manifests and cryptographic hashes are embedded directly inside the `evidence` document.  
   *Justification:* 1:1 and bounded 1:N relationship. Merkle blocks are always queried together with the evidence item during verification. Embedding guarantees **single-seek read operations** without costly relational JOIN latency.
2. **Document References:** Cases and Evidence are modeled via references (`caseId`).  
   *Justification:* Unbounded 1:N relationship. A large corporate investigation may contain 50,000 files. Embedding all files in one document would breach MongoDB's **16 MB BSON document size limit**.

### 6.2 Compound Index Optimization & `.explain()` Query Plan Analysis
To eliminate in-memory sorting penalties (`SORT` stage) in RAM, ForenSight enforces specialized compound indexes:

* **Index:** `idx_case_acq` $\rightarrow$ `[("caseId", 1), ("acquisitionTimestamp", -1)]`
* **Query:** Retrieve evidence for a case ordered by newest first:
  ```javascript
  db.evidence.find({ caseId: "CASE-2026-001" }).sort({ acquisitionTimestamp: -1 }).explain("executionStats")
  ```
* **Performance Guarantee:** The winning stage is `IXSCAN` (Index Scan). The index covers both filtering and sorting, ensuring $\text{docsExamined} = \text{keysExamined}$ and zero in-memory sort penalty.

### 6.3 Multi-Stage Real-Time Aggregation Pipelines
ForenSight utilizes MongoDB's native aggregation framework (`$facet`, `$group`, `$sort`) to compute live investigation telemetry in a single pass:
```javascript
db.evidence.aggregate([
  { $match: { caseId: "CASE-2026-001" } },
  {
    $facet: {
      integrityMetrics: [
        { $group: { _id: "$verificationStatus", count: { $sum: 1 } } }
      ],
      typeDistribution: [
        { $group: { _id: "$evidenceType", totalBytes: { $sum: "$fileSize" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]
    }
  }
])
```

### 6.4 Dual-Engine Database Architecture
The platform features an enterprise resilience layer:
- **Primary:** Connects to live MongoDB 7.0 (WiredTiger) with connection pooling.
- **Fallback:** In the absence of an active MongoDB daemon, it automatically switches to an in-memory document engine with atomic disk synchronization (`storage/forensight_nosql_data.json`), ensuring high portability across field examination laptops.

---

## 7. Experimental Results, Verification Walkthrough & Test Suite

### 7.1 Automated Unit & Integration Testing (100% Pass Rate)
The system was validated using Pytest across 13 exhaustive test modules:

```text
============================= test session starts =============================
platform win32 -- Python 3.14.0, pytest-8.3.4
rootdir: C:\Users\giridharan\Downloads\foresenic

backend/tests/test_api.py::test_api_health PASSED                        [  7%]
backend/tests/test_api.py::test_acquire_and_verify_pipeline PASSED       [ 15%]
backend/tests/test_api.py::test_watchdog_detects_storage_tampering PASSED [ 23%]
backend/tests/test_api.py::test_chain_of_custody_tamper_detection PASSED [ 30%]
backend/tests/test_api.py::test_pdf_report_generation PASSED              [ 38%]
backend/tests/test_core.py::test_multi_hash_calculation PASSED           [ 46%]
backend/tests/test_core.py::test_merkle_tree_consistency_and_proof PASSED[ 53%]
backend/tests/test_core.py::test_file_identity_and_extension_spoofing PASSED [ 61%]
backend/tests/test_core.py::test_tamper_localization_diff PASSED          [ 69%]
backend/tests/test_mongodb.py::test_mongodb_initialization_and_indexes PASSED [ 76%]
backend/tests/test_mongodb.py::test_mongodb_crud_operations PASSED        [ 84%]
backend/tests/test_mongodb.py::test_mongodb_aggregation_pipeline PASSED   [ 92%]
backend/tests/test_mongodb.py::test_mongodb_explain_plan PASSED           [100%]

============================= 13 passed in 70.89s =============================
```

### 7.2 Experimental Benchmark Scenarios

| Experiment ID | Test Scenario | Expected Outcome | System Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **EXP-01** | Upload reference image `demo_incident_photo_reference.jpg` | Baseline MD5, SHA-1, SHA-256 & Merkle root calculated cleanly | Hashes computed with 64KB stream buffers; 100% block match | **PASS** |
| **EXP-02** | Tamper single sector in image (`demo_incident_photo_tampered.jpg`) | Pinpoint modified 4KB block index and byte offset range | Differing block localized to exact offset $[16384, 20479]$; ELA heatmap generated | **PASS** |
| **EXP-03** | Upload PE binary disguised as PDF (`demo_spoofed_extension.pdf`) | Detect mismatch between magic bytes `4D 5A` and `.pdf` extension | Raised `MAGIC_BYTES_MISMATCH` with `CRITICAL` severity rating | **PASS** |
| **EXP-04** | Manually modify custody database record | Hash chain re-verification must fail | Chain broken at altered sequence index; flagged as `COMPROMISED` | **PASS** |
| **EXP-05** | Direct disk file alteration during runtime | Background watchdog detects hash deviation within 30 seconds | SSE alert fired; integrity badge switched to `COMPROMISED` | **PASS** |

---

## 8. Comparative Analysis against Industry Standard Tools

| Capability / Feature | Traditional Tools (EnCase, FTK) | Open-Source Suites (Autopsy) | **ForenSight (Our System)** |
| :--- | :--- | :--- | :--- |
| **Primary Integrity Metric** | Single Full-File MD5 / SHA-256 | Single Hash (SHA-256) | **Multi-Hash (MD5, SHA-1, SHA-256) + 4096-Byte Merkle Tree** |
| **Tamper Localization** | Not Supported (Binary pass/fail) | Not Supported | **Supported (Exact Byte-Offset Ranges & Visual Heatmap)** |
| **Memory Footprint** | Variable (often high RAM load) | File size dependent | **Strict $\mathcal{O}(1)$ RAM Complexity (64 KB Streaming)** |
| **Database Architecture** | Proprietary Relational / Flat Files | SQLite / PostgreSQL | **MongoDB NoSQL with Compound Indexing & Aggregations** |
| **Chain of Custody** | Paper or Flat Form Database | Basic Table Logs | **Append-Only SHA-256 Parent-Child Hash Chain** |
| **Storage Tamper Watchdog** | None (Batch audit only) | None | **Continuous 30-Second Async Daemon with Real-Time SSE** |
| **Indian Legal Compliance** | Generic Export | Generic CSV / HTML | **Certified Section 63(4) BSA 2023 Court Admissibility PDF** |

---

## 9. Conclusion & Future Work

### 9.1 Conclusion
The **ForenSight** platform successfully demonstrates that digital forensics workflows can be elevated from simple binary hash verification to **deterministic, byte-level tamper localization**. By unifying stream-buffered multi-algorithm hashing, 4096-byte Merkle tree block slicing, Error Level Analysis, append-only hash-chained custody ledgers, and a high-performance MongoDB NoSQL document architecture, the platform fulfills all technical and legal criteria mandated by **ISO/IEC 27037:2012** and **Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023**.

### 9.2 Future Enhancements
1. **Hardware-Accelerated Cryptographic Hashing:** Implementing CUDA/GPU kernel acceleration for multi-gigabyte disk image Merkle tree slicing.
2. **Distributed Blockchain Anchoring:** Extending the existing EVM smart contract anchor (`ForenChainRegistry.sol`) to public decentralized networks (e.g., Ethereum Layer 2 Arbitrum or Polygon) for tamper-proof public auditability.
3. **Deepfake Video & Audio Analytics:** Integrating frame-by-frame temporal optical flow analysis to detect generative AI facial modifications in surveillance video evidence.

---

## 10. References

1. **International Organization for Standardization (ISO).** (2012). *ISO/IEC 27037:2012 — Guidelines for identification, collection, acquisition, and preservation of digital evidence*. Geneva: ISO.
2. **National Institute of Standards and Technology (NIST).** (2006). *Guide to Integrating Forensic Techniques into Incident Response* (NIST Special Publication 800-86). U.S. Department of Commerce.
3. **Ministry of Law and Justice, Government of India.** (2023). *The Bharatiya Sakshya Adhiniyam, 2023 (Act No. 47 of 2023)*, Section 63: Admissibility of Electronic Records. The Gazette of India.
4. **Merkle, R. C.** (1987). "A Digital Signature Based on a Conventional Encryption Function." *Advances in Cryptology — CRYPTO '87*, Lecture Notes in Computer Science, Vol. 293, pp. 369–378. Springer, Berlin, Heidelberg.
5. **Krawetz, N.** (2007). "A Picture's Worth... Digital Image Analysis and Error Level Analysis (ELA)." *Hacker Factor Solutions*, White Paper, pp. 1–13.
6. **MongoDB Inc.** (2024). *MongoDB 7.0 Manual: The WiredTiger Storage Engine, Indexing Strategies, and Aggregation Pipeline Optimization*. MongoDB Documentation.
7. **FastAPI & Tiangolo.** (2024). *FastAPI Documentation: High-Performance Asynchronous Python Web Framework*.
8. **Brezinski, D., & Killalea, T.** (2002). *Guidelines for Evidence Collection and Archiving* (RFC 3227). Internet Engineering Task Force (IETF).

---
*Report submitted by: **Giridharan R E (23MIA1128)** — B.Tech Computer Science and Engineering (SCOPE), VIT Chennai*
