# ForenSight — Comprehensive Project Documentation & Review Manual

**Project Name:** ForenSight — Digital Forensics & NoSQL Database Investigation Platform  
**Target Evaluation:** Digital Forensics Review & Advanced Database Systems Examination  
**Compliance & Legal Frameworks:** ISO/IEC 27037:2012, NIST SP 800-86, RFC 3227, Bharatiya Sakshya Adhiniyam (BSA) 2023 Section 63(4), US FRE Rule 902(13/14)  
**Document Generation Date:** October 2026  

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [System Architecture & Technology Stack](#2-system-architecture--technology-stack)
3. [Step-by-Step Setup & Execution Manual](#3-step-by-step-setup--execution-manual)
4. [Digital Forensics Core Methodologies](#4-digital-forensics-core-methodologies)
   - [A. Stream-Buffered Multi-Algorithm Hashing](#a-stream-buffered-multi-algorithm-hashing)
   - [B. 4096-Byte Merkle Tree Slicing & Tamper Localization](#b-4096-byte-merkle-tree-slicing--tamper-localization)
   - [C. The 5-Part Forensic Diagnostic Engine](#c-the-5-part-forensic-diagnostic-engine)
   - [D. Append-Only Hash-Chained Chain of Custody](#d-append-only-hash-chained-chain-of-custody)
   - [E. Continuous Storage Integrity Watchdog Daemon](#e-continuous-storage-integrity-watchdog-daemon)
   - [F. Statutory Court-Admissible Reporting (BSA Sec 63(4))](#f-statutory-court-admissible-reporting-bsa-sec-634)
5. [NoSQL Database (MongoDB) Architecture](#5-nosql-database-mongodb-architecture)
   - [A. 8 Operational Collections](#a-8-operational-collections)
   - [B. Embedding vs. Referencing Decisions](#b-embedding-vs-referencing-decisions)
   - [C. Compound Indexes & Live `.explain()` Execution](#c-compound-indexes--live-explain-execution)
   - [D. Multi-Stage Aggregation Pipelines](#d-multi-stage-aggregation-pipelines)
   - [E. Dual-Engine Resilience Architecture](#e-dual-engine-resilience-architecture)
6. [Frontend Routes & Navigation Map](#6-frontend-routes--navigation-map)
7. [REST API Endpoints Reference](#7-rest-api-endpoints-reference)
8. [Faculty Review Defense & Q&A Cheat Sheet](#8-faculty-review-defense--qa-cheat-sheet)

---

## 1. Executive Summary

**ForenSight** is a high-assurance, database-driven digital forensics investigation and evidence management platform. Modern electronic crime scenes present forensic investigators with two critical challenges:
1. **The Hash Inadequacy Problem:** Standard cryptographic hashes (such as a single full-file SHA-256) are binary flags. They determine *if* an electronic artifact was modified, but cannot localize *where* tampering took place within a multi-megabyte or multi-gigabyte bitstream.
2. **Metadata Polymorphism:** Electronic evidence spans heterogeneous data types—from JPEG EXIF telematics and PDF stream dictionaries to Windows PE headers and raw file sectors. Relational databases force these into sparse, nullable tables with excessive JOIN costs.

ForenSight solves both challenges:
- It introduces **deterministic 4096-byte Merkle tree block slicing** to pinpoint the exact physical byte offsets of tampering.
- It leverages **MongoDB document architecture** to embed deterministic block trees while referencing high-volume cases and custody transactions.
- It enforces strict compliance with **ISO/IEC 27037:2012** (Digital Evidence Handling) and automatically compiles court-admissible certificates fulfilling **Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023 (BSA)**.

---

## 2. System Architecture & Technology Stack

ForenSight utilizes a decoupled, three-tier architecture:

```
+-----------------------------------------------------------------------------------+
|                           PRESENTATION TIER (PORT 5173)                           |
|       React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + Recharts + Lucide Icons  |
|                                                                                   |
|  [Dashboard] [Wizard] [Evidence] [Verify] [Analysis] [Custody] [Database] [Report]|
+-----------------------------------------+-----------------------------------------+
                                          | HTTP REST APIs + Server-Sent Events (SSE)
+-----------------------------------------v-----------------------------------------+
|                        APPLICATION & FORENSIC TIER (PORT 8000)                    |
|                        FastAPI + Python 3.11+ / Uvicorn Engine                    |
|                                                                                   |
|  +--------------------------+  +--------------------------+  +------------------+ |
|  |   Acquisition Service    |  |  5-Check Diagnostic Core |  | Watchdog Daemon  | |
|  |   - 64 KB Stream Hash    |  |  - Magic Byte Scanner    |  | - 30s Poller     | |
|  |   - 4096B Merkle Slicer  |  |  - Pillow EXIF/GPS       |  | - SSE Event Hub  | |
|  |   - Storage Dispatcher   |  |  - OpenCV ELA Heatmap    |  | - Disk Scanner   | |
|  +--------------------------+  +--------------------------+  +------------------+ |
|                                                                                   |
|  +------------------------------------------------------------------------------+ |
|  |                      MongoManager Database Core                              | |
|  |       - Primary: Live MongoDB 7.0 (WiredTiger Storage Engine)                | |
|  |       - Fallback: In-Memory Engine + Atomic Disk Sync (JSON Durability)      | |
|  +------------------------------------------------------------------------------+ |
+---------------------+-------------------------------+-----------------------------+
                      | BSON Commands                 | Web3 JSON-RPC
+---------------------v---------------+   +-----------v-----------------------------+
|              DATABASE TIER          |   |           BLOCKCHAIN TIER               |
|         MongoDB 7.0 (WiredTiger)    |   |        Ethereum / Ganache (Port 8545)   |
|                                     |   |                                         |
|  8 BSON Collections:                |   |   Smart Contract: ForenChain.sol        |
|  - cases         - evidence         |   |   - anchorEvidence(id, sha256, root)    |
|  - custodyEvents - analysisJobs     |   |   - verifyAnchor(id, sha256)            |
|  - findings      - auditLogs        |   |                                         |
|  - watchdogAudits- users            |   |   Fallback: In-Database Anchoring       |
+-------------------------------------+   +-----------------------------------------+
                      | File I/O
+---------------------v-------------------------------------------------------------+
|                            STORAGE REPOSITORY TIER                                |
|   ./storage/evidence/ (Raw Bitstream)       ./storage/findings/ (Heatmaps / ELA)  |
|   ./storage/manifests/ (Merkle JSON)        ./storage/reports/ (PDF Exports)      |
+-----------------------------------------------------------------------------------+
```

### Technology Breakdown
- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide React icons, Axios, Recharts.
- **Backend:** FastAPI, Python 3.11+, Uvicorn, Pydantic v2, ReportLab (PDF generator), Pillow (EXIF), OpenCV Headless (ELA & Jet colormaps), PyPDF.
- **Database Engine:** MongoDB 7.0 (WiredTiger) via PyMongo / MongoManager with automatic in-memory persistent disk synchronization fallback (`storage/forensight_nosql_data.json`).
- **Cryptographic Anchoring:** Web3.py with EVM Smart Contract (`ForenChain.sol`) and cryptographic in-database anchoring fallback.

---

## 3. Step-by-Step Setup & Execution Manual

### Prerequisites
- **Python 3.11+** installed (`python --version`)
- **Node.js 18+** installed (`node --version`)
- **Git** (optional)

### Step 1: Start the Backend API Server
Open a terminal in the project root:
```powershell
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server with auto-reload
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* **Interactive API Documentation (Swagger):** `http://127.0.0.1:8000/docs`
* **Alternative ReDoc UI:** `http://127.0.0.1:8000/redoc`

### Step 2: Start the React Frontend Application
Open a second terminal:
```powershell
cd frontend

# Install node packages
npm install

# Start Vite dev server
npm run dev
```
* **Frontend Web Application:** `http://localhost:5173`

*(Optional) Seed Synthetic Demo Data:*
Once running, navigate to `http://localhost:5173/settings` and click **"Seed Synthetic Forensic Dataset"** to populate realistic cases, tampered evidence, custody events, and audit logs.

---

## 4. Digital Forensics Core Methodologies

### A. Stream-Buffered Multi-Algorithm Hashing
Traditional forensic tools often load files entirely into memory to compute hashes, creating **Out-Of-Memory (OOM)** failures when handling multi-gigabyte forensic disk images.

ForenSight enforces **single-pass streaming hashing**:
```python
CHUNK_SIZE = 65536  # 64 KB streaming buffer
hasher_md5 = hashlib.md5()
hasher_sha1 = hashlib.sha1()
hasher_sha256 = hashlib.sha256()

with open(file_path, "rb") as f:
    while chunk := f.read(CHUNK_SIZE):
        hasher_md5.update(chunk)
        hasher_sha1.update(chunk)
        hasher_sha256.update(chunk)
```
- **Time Complexity:** $O(N)$ where $N$ is file size.
- **RAM Complexity:** $O(1)$ constant memory overhead (never exceeds 64 KB).
- **Collision Protection:** Computing MD5, SHA-1, and SHA-256 simultaneously defeats known hash collision attacks against older standards.

---

### B. 4096-Byte Merkle Tree Slicing & Tamper Localization

To identify the exact location of file alteration, ForenSight slices the bitstream into **4096-byte blocks**:

```
                       [ Merkle Root ]
                          /        \
                  [ H_01 ]          [ H_23 ]
                  /      \          /      \
               [ H_0 ]   [ H_1 ]  [ H_2 ]  [ H_3 ]
               (Block0)  (Block1) (Block2) (Block3)
               [ 4096B ] [ 4096B ] [ 4096B ] [ 4096B ]
```

1. **Leaf Generation:** Each block $B_i$ yields $H_i = \text{SHA-256}(B_i)$.
2. **Tree Reduction:** Parent nodes are generated pairwise: $\text{Parent} = \text{SHA-256}(H_{2j} \parallel H_{2j+1})$ until the single **Merkle Root** is produced.
3. **Tamper Localization Algorithm:**
   When verifying candidate evidence against the registered baseline:
   $$\text{DiffBlocks} = \{ i \mid H_{\text{candidate}, i} \neq H_{\text{baseline}, i} \}$$
   For each differing block index $i$, the physical byte range is pinpointed:
   $$\text{Byte Range} = [i \times 4096, \; (i + 1) \times 4096 - 1]$$
   The user interface displays an interactive **Tamper Sector Grid** highlighting affected blocks in red.

---

### C. The 5-Part Forensic Diagnostic Engine

ForenSight executes five independent diagnostic passes on every uploaded artifact:

| Diagnostic Check | Methodology | Forensic Threat Detected |
| :--- | :--- | :--- |
| **1. Multi-Hash Cross-Check** | MD5, SHA-1, SHA-256 concurrent divergence check | Hash collision attacks, bit rot, data corruption |
| **2. Magic Bytes Inspection** | Scans leading binary header signatures (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, `25 50 44 46` for PDF, `4D 5A` for Windows EXE) | File extension spoofing (e.g. `malware.exe` renamed to `invoice.pdf`) |
| **3. EXIF & Metadata Telematics** | Parses embedded EXIF tags, GPS decimal coordinates, device serial numbers, and author tags | Location tracking, device identification, editing software signatures (Photoshop) |
| **4. Error Level Analysis (ELA)** | Recompresses image at 95% quality, calculates pixel delta $\Delta(x,y) = \|I_{\text{orig}} - I_{\text{recomp}}\| \times 15$, applies OpenCV `COLORMAP_JET` | Digital image manipulation, cloned regions, spliced objects |
| **5. Temporal Paradox Analysis** | Filesystem timestamp vs. EXIF capture timestamp vs. internal document modification logs | Anachronisms, backdated timestamps, file modified prior to its creation timestamp |

---

### D. Append-Only Hash-Chained Chain of Custody

Chain of custody is the legal cornerstone of digital evidence admissibility. ForenSight implements an append-only digital custody ledger utilizing **SHA-256 Hash Chaining**:

For custody transfer event $E_k$:
$$\text{Payload}_k = \text{CanonicalJSON}(E_k.\text{evidenceId}, E_k.\text{action}, E_k.\text{fromCustodian}, E_k.\text{toCustodian}, E_k.\text{timestamp}, E_k.\text{location}, E_k.\text{reason})$$
$$\text{EventHash}_k = \text{SHA-256}(\text{EventHash}_{k-1} \parallel \text{Payload}_k)$$

Where $\text{EventHash}_0 = \text{SHA-256}(\text{"00000000000000000000000000000000"})$ (Genesis Anchor).

*Verification Guarantee:* If any record is maliciously edited, deleted, or reordered in the database, recomputing the hash sequence breaks at index $k$:
$$\text{RecomputedHash}_k \neq \text{StoredEventHash}_k$$
The platform marks the chain as **COMPROMISED** and pinpoints the exact compromised record.

---

### E. Continuous Storage Integrity Watchdog Daemon

To detect unauthorized out-of-band disk tampering or bit rot:
1. An autonomous background daemon (`app/services/watchdog.py`) executes every **30 seconds**.
2. It re-reads physical files in `storage/evidence/` and recalculates their SHA-256 digests.
3. It cross-checks digests against MongoDB baseline records and blockchain anchors.
4. If a single byte is modified outside the application, the watchdog immediately:
   - Sets `integrityStatus = 'COMPROMISED'`.
   - Records an urgent audit log.
   - Pushes an instant real-time notification to all connected examiner screens via **Server-Sent Events (SSE)**.

---

### F. Statutory Court-Admissible Reporting (BSA Sec 63(4))

ForenSight automatically formats and renders a court-ready certificate compliant with:
- **Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023 (BSA)** (India, replacing Sec 65B of Indian Evidence Act, 1872).
- **Federal Rules of Evidence (FRE) Rule 902(13) & (14)** (United States).

The generated PDF includes:
1. System and storage hardware declarations of normal operation without compromise.
2. Baseline cryptographic multi-hashes (MD5, SHA-1, SHA-256) and Merkle Root.
3. Chronological chain-of-custody event log with cryptographic proof signatures.
4. Examiner credential declarations, digital signature blocks, and official seals.

---

## 5. NoSQL Database (MongoDB) Architecture

### A. 8 Operational Collections

```
+---------------------------------------------------------------------------------+
|                                 MONGODB COLLECTIONS                             |
+-------------------+-------------------------------------------------------------+
| Collection Name   | Forensic Purpose                                            |
+-------------------+-------------------------------------------------------------+
| cases             | Investigation master records, case status, priority, dates  |
| evidence          | Electronic artifacts, baseline hashes, embedded Merkle tree |
| custodyEvents     | Append-only custody transfer ledger with SHA-256 chaining   |
| analysisJobs      | Automated diagnostic execution state and progress           |
| findings          | Machine diagnostic observations and investigator conclusions|
| auditLogs         | Immutable administrative and operator audit trails          |
| watchdogAudits    | Historical logs of periodic 30-second storage integrity runs|
| users             | System users, examiners, and role-based permissions         |
+-------------------+-------------------------------------------------------------+
```

---

### B. Embedding vs. Referencing Decisions

| Entity Relationship | Design Strategy | Academic & Forensic Justification |
| :--- | :--- | :--- |
| **Evidence $\rightarrow$ Merkle Blocks** | **Embedded Subdocuments** | **Single-Seek Retrieval:** Merkle blocks are always required when verifying evidence. Embedding eliminates costly multi-table JOINs and ensures atomic read/write of evidence manifests. |
| **Cases $\rightarrow$ Evidence** | **Referenced (`caseId`)** | **BSON 16 MB Boundary:** A large fraud investigation can contain 50,000 files. Embedding all files in one case document would exceed MongoDB's 16 MB document size limit. |
| **Evidence $\rightarrow$ Custody Events** | **Referenced (`evidenceId`)** | **Unbounded Growth:** High-profile evidence may undergo hundreds of transfers over years of litigation. Normalizing into `custodyEvents` prevents document fragmentation and unbounded growth. |

---

### C. Compound Indexes & Live `.explain()` Execution

ForenSight defines specialized compound indexes designed to eliminate in-memory sorting penalties:

- **Case Timeline Index:** `[("caseId", 1), ("acquisitionTimestamp", -1)]`
  - *Purpose:* Allows direct index scans (`IXSCAN`) when querying an investigation's evidence in reverse chronological order.
  - *Performance Guarantee:* `keysExamined == docsExamined`, zero in-memory `SORT` stage overhead, $O(\log N)$ retrieval complexity.
- **Custody Sequence Index:** `[("evidenceId", 1), ("sequenceNumber", 1)]` (Unique)
  - *Purpose:* Enforces strict linear progression of custody records and prevents race conditions.

#### The In-App Query Explain Tool (`/database`)
Under the **Live Query Explain** tab, evaluators can inspect live winning execution plans:
- Confirms stage is `IXSCAN` (Index Scan) rather than `COLLSCAN` (Table Scan).
- Compares execution latency and documents scanned.

---

### D. Multi-Stage Aggregation Pipelines

ForenSight uses multi-stage MongoDB aggregations to compute real-time analytical dashboards:
```javascript
db.evidence.aggregate([
  { $match: { caseId: "CASE-2026-001" } },
  {
    $facet: {
      integrityMetrics: [
        { $group: { _id: "$integrityStatus", count: { $sum: 1 } } }
      ],
      mimeDistribution: [
        { $group: { _id: "$mimeType", totalSize: { $sum: "$fileSize" }, count: { $sum: 1 } } },
        { $sort: { totalSize: -1 } }
      ],
      timelineBounds: [
        { $group: { _id: null, earliest: { $min: "$acquisitionTimestamp" }, latest: { $max: "$acquisitionTimestamp" } } }
      ]
    }
  }
])
```
*Benefits:* Executes statistical, categorical, and volumetric rollups in a single server-side pass.

---

### E. Dual-Engine Resilience Architecture
ForenSight implements a dual-mode database driver inside `app/core/mongo.py`:
1. **Primary Mode:** Connects to live MongoDB 7.0 instances (local daemon or MongoDB Atlas).
2. **Fallback Mode:** If no MongoDB daemon is running, ForenSight automatically starts its durable **In-Memory Engine with Atomic JSON Disk-Sync** (`storage/forensight_nosql_data.json`), ensuring zero-configuration execution during examinations or mobile field deployments.

---

## 6. Frontend Routes & Navigation Map

| Route Path | View Name | Key Forensic / Academic Capabilities |
| :--- | :--- | :--- |
| `/` | **Product Landing** | System overview, 5-stage investigation lifecycle, technical specifications |
| `/workspace/new` | **Investigation Wizard** | 5-step guided walkthrough for creating cases and acquiring evidence |
| `/workspace` | **Investigator Workspace** | High-level metrics, active cases, evidence counts, integrity health |
| `/cases` | **Case Repository** | Filter and manage cases by status (Active, In Review, Closed, Archived) |
| `/evidence` | **Evidence Repository** | Central evidence vault with integrity badges and case filters |
| `/evidence/:id` | **Evidence Deep Inspection** | Multi-tab view: baseline hashes, Merkle tree blocks, findings, custody |
| `/register` | **Acquisition Intake** | Direct file upload with real-time multi-hash and Merkle root calculation |
| `/verify` | **Integrity Verification** | Byte-level diff comparator with interactive Tamper Sector Grid |
| `/analysis` | **Diagnostic Engine** | Autonomous 5-part forensic checks, ELA heatmap previews, anomaly flags |
| `/custody` | **Chain of Custody** | Cryptographic handover ledger with one-click chain validation |
| `/timeline` | **Unified Incident Timeline** | Chronological alignment of filesystem, EXIF, and custody timestamps |
| `/reports` | **Reports & Certificates** | Statutory Section 63(4) BSA compliance PDF certificate generator |
| `/database` | **NoSQL Database Inspector** | Collections, index justifications, live `.explain()` runner, aggregation demo |
| `/watchdog` | **Integrity Watchdog** | Real-time monitoring of continuous storage integrity scans via SSE |
| `/audit` | **System Audit Trail** | Immutable log of administrative, operator, and system actions |
| `/docs` | **In-App Academic Docs** | Built-in reference guides for Forensics and NoSQL evaluators |
| `/settings` | **System Diagnostics** | Storage path verifications, environment telemetry, synthetic demo seeder |

---

## 7. REST API Endpoints Reference

All endpoints are served under prefix `/api/v1`:

### Health & Telemetry
- `GET /health` — Returns system status, database engine (Live MongoDB vs Fallback), blockchain status, and watchdog state.

### Cases
- `GET /cases` — List all investigation cases.
- `POST /cases` — Register a new case.
- `GET /cases/{id}` — Retrieve case details and child evidence summaries.
- `PUT /cases/{id}` — Update case status, priority, or assigned examiner.

### Evidence & Acquisition
- `GET /evidence` — List evidence records with optional case and status filters.
- `POST /evidence/acquire` — Upload and acquire electronic artifact (streams multi-hash, builds Merkle tree, stores bitstream).
- `GET /evidence/{id}` — Full evidence document with embedded Merkle manifest and multi-hashes.
- `POST /evidence/{id}/verify` — Compare candidate file against stored baseline Merkle blocks.

### Diagnostics & Analysis
- `POST /analysis/run` — Trigger the 5-part diagnostic suite against an acquired evidence item.
- `GET /findings` — List diagnostic findings and anomalies.
- `PUT /findings/{id}/review` — Update investigator review status and conclusions.

### Chain of Custody
- `GET /custody` — Retrieve chronological custody handover records.
- `POST /custody/transfer` — Record new custody transfer with SHA-256 parent chaining.
- `GET /custody/verify/{evidenceId}` — Cryptographically verify entire custody chain integrity.

### Watchdog & Events
- `GET /watchdog/status` — Watchdog daemon health and recent scans.
- `GET /events` — Real-time Server-Sent Events (SSE) stream for instant tampering notifications.

### Reports
- `POST /reports/generate` — Generate statutory Section 63(4) BSA / ISO 27037 PDF certificate.
- `GET /reports/download/{filename}` — Download generated PDF compliance report.

### NoSQL Database Inspector
- `GET /db/collections` — Document counts, index statistics, and BSON sizing for all 8 collections.
- `POST /db/explain` — Execute live MongoDB `.explain("executionStats")` on dynamic queries.
- `POST /db/aggregate-demo` — Run multi-stage `$facet` and `$group` aggregation pipeline.

---

## 8. Faculty Review Defense & Q&A Cheat Sheet

### Question 1: *"Why did you use a Merkle tree instead of just standard SHA-256?"*
> **Answer:**  
> A standard SHA-256 hash is a single binary indicator. If an attacker modifies even a single bit of a 500 MB disk image, SHA-256 changes completely (due to the avalanche effect), but provides zero information about *what* or *where* data was altered.  
> ForenSight partitions the file into 4096-byte blocks and computes a Merkle tree. When a candidate file is verified against the baseline, we compare individual leaf hashes to identify the exact block index $i$ and pinpoint the physical byte range $[i \times 4096, (i+1) \times 4096 - 1]$.

### Question 2: *"How does the Chain of Custody prevent a malicious database administrator from altering records?"*
> **Answer:**  
> Our chain of custody is not a simple database table; it is an **append-only cryptographic hash chain**. Each event digest is computed as:
> $$\text{EventHash}_k = \text{SHA-256}(\text{EventHash}_{k-1} \parallel \text{CanonicalPayload}_k)$$
> If a rogue DBA alters a custodian name, timestamp, or deletes a transfer record, the recomputed hash at that position will not match $\text{StoredEventHash}_k$, causing the cryptographic chain verification (`/custody/verify`) to fail and pinpoint the exact tampered entry.

### Question 3: *"Why did you choose MongoDB over a Relational Database like PostgreSQL?"*
> **Answer:**  
> Digital evidence metadata is **polymorphic**: JPEG images have EXIF tags, PDFs have trailer dictionaries, executables have PE section tables, and disk dumps have raw hex blocks. An RDBMS requires either dozens of sparse, nullable tables with expensive multi-table JOINs or lossy JSON columns.  
> MongoDB natively handles rich, nested BSON documents. We utilize **embedding** for 1:1 and bounded 1:N data (e.g. Merkle blocks) to enable fast single-seek disk reads, while using **referencing** (`caseId`) for unbounded relationships to strictly obey MongoDB's 16 MB BSON document size boundary.

### Question 4: *"What is Error Level Analysis (ELA) and how does Check 4 detect image tampering?"*
> **Answer:**  
> JPEG compression uses lossy Discrete Cosine Transforms (DCT) in $8 \times 8$ pixel grids. As an image is saved repeatedly, its error level stabilizes. When an unauthorized user splices a new element into an image (for example, pasting a face or altering a date on a receipt), that inserted area has not undergone the same compression history.  
> ForenSight re-compresses the image at 95% quality, calculates the absolute pixel difference delta, amplifies it by $15\times$, and applies an OpenCV Jet colormap (`cv2.COLORMAP_JET`). Manipulated regions stand out clearly with high-frequency false-color brightness.

### Question 5: *"What legal compliance standard does the generated PDF report satisfy?"*
> **Answer:**  
> In India, digital evidence must be accompanied by a statutory certificate under **Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023 (BSA)** (which superseded Section 65B of the Indian Evidence Act, 1872). Internationally, it aligns with **ISO/IEC 27037:2012** and **US Federal Rules of Evidence Rule 902(13/14)**. ForenSight's automated ReportLab pipeline generates an official certificate containing cryptographic hash digests, device operational affirmations, examiner credentials, and chain of custody logs.

---
*End of Documentation — ForenSight Forensic Systems Evaluation Manual*

