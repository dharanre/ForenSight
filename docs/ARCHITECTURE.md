# ForenSight — System Architecture Specification

## 1. High-Level Architecture Overview

ForenSight is structured as a multi-tier, decoupled digital forensics platform combining high-performance Python analytics with a document-oriented NoSQL database and cryptographic anchoring:

```
+-------------------------------------------------------------------------------+
|                       FORENSIGHT PRESENTATION TIER                            |
|             React 18 + Vite + TypeScript + Tailwind CSS (Port 5173)           |
|                                                                               |
|  [Dashboard] [Cases] [Evidence] [Analysis] [Custody] [Timeline] [NoSQL View]  |
+---------------------------------------+---------------------------------------+
                                        | REST APIs + SSE Stream (/api/v1)
+---------------------------------------v---------------------------------------+
|                         APPLICATION & FORENSIC TIER                           |
|                       FastAPI + Python 3.14 (Port 8000)                       |
|                                                                               |
|  +------------------------+  +------------------------+  +-----------------+  |
|  |  Acquisition Pipeline  |  |  5-Check Forensic Core |  | Watchdog Daemon |  |
|  |  - Stream Multi-Hash   |  |  - Magic Byte Verifier |  | - 30s Polling   |  |
|  |  - 4096B Merkle Tree   |  |  - Pillow EXIF/GPS     |  | - SSE Broadcast |  |
|  |  - File Dispatcher     |  |  - OpenCV ELA Heatmap  |  | - Bitstream Rev |  |
|  +------------------------+  +------------------------+  +-----------------+  |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |                         MongoManager Core                               |  |
|  |          - Primary: Live MongoDB 7.0 Connection Pool                    |  |
|  |          - Fallback: Embedded In-Memory Engine + Atomic Disk Sync       |  |
|  +-------------------------------------------------------------------------+  |
+-------------------+-----------------------------+-----------------------------+
                    |                             |
                    | BSON Operations             | EVM Web3 Calls
+-------------------v-------------+   +-----------v-----------------------------+
|        DATABASE TIER            |   |           BLOCKCHAIN TIER               |
|      MongoDB 7.0 (WiredTiger)   |   |        Ethereum / Ganache (Port 8545)   |
|                                 |   |                                         |
|  8 Operational Collections:     |   |   Smart Contract: ForenChain.sol        |
|  - cases         - evidence     |   |   - anchorEvidence(id, sha256, root)    |
|  - custodyEvents - analysisJobs |   |   - verifyAnchor(id, sha256)            |
|  - findings      - auditLogs    |   |                                         |
|  - watchdogAudits- users        |   |   Dual-Anchor Fallback to MongoDB       |
+---------------------------------+   +-----------------------------------------+
                    |
                    | File System I/O
+-------------------v-----------------------------------------------------------+
|                          PERSISTENT STORAGE TIER                              |
|   ./storage/evidence/ (Raw Bitstream)    ./storage/heatmaps/ (ELA Overlays)   |
|   ./storage/manifests/ (Merkle JSON)     ./storage/reports/ (PDF Exports)     |
+-------------------------------------------------------------------------------+
```

---

## 2. Component Subsystems

### 1. Presentation Tier (`frontend/`)
- **Technology:** React 18, Vite, TypeScript, TailwindCSS, Lucide icons, Recharts.
- **Routing Structure:** 13 dedicated forensic navigation routes:
  - `/` Overview Dashboard
  - `/cases` Case Management
  - `/evidence` Evidence Explorer
  - `/evidence/:id` Evidence Detail & Deep Analysis
  - `/register` Acquisition Intake
  - `/verify` Candidate Copy Verification
  - `/analysis` Forensic Pipeline & Findings Review
  - `/custody` Chain of Custody Ledger & Verifier
  - `/timeline` Correlated Investigation Timeline
  - `/reports` Case Reports & BSA Section 63(4) Certificates
  - `/database` NoSQL Database Inspector & Explain Runner
  - `/watchdog` Integrity Watchdog Monitor
  - `/settings` System Architecture & Settings

### 2. Forensic Analytics Engine (`backend/app/services/`)
- **`acquisition.py`:** Handles file ingestion, 64KB stream-buffered multi-hashing (MD5, SHA-1, SHA-256), 4096-byte Merkle tree block slicing, and database document emission.
- **`forensic_engine.py`:** Autonomous 5-part forensic check execution (Magic bytes, EXIF, GPS, OpenCV ELA, and temporal inversion heuristics).
- **`custody.py`:** Append-only ledger management with cryptographic parent-child SHA-256 hash chaining.
- **`watchdog.py`:** Background asyncio task continuously verifying bitstream files against anchored baseline records. Emits real-time SSE alerts.
- **`report.py`:** ReportLab engine compiling statutory digital forensics PDF certificates under Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023.

### 3. Database Layer (`backend/app/core/mongo.py`)
- **`MongoManager`:** Thread-safe MongoDB connection pool manager.
- **Indexes:** 7 single and compound indexes maintaining $O(\log N)$ query times.
- **Aggregations:** Native `$facet` and `$group` analytical pipelines.
- **Explain Runner:** Programmatic access to `.explain('executionStats')` for query performance evaluation.

---

## 3. Data Flow Architecture

### Ingestion Flow
1. Examiner posts multipart form payload to `/api/v1/evidence`.
2. `acquisition.py` streams file bytes, calculates multi-hashes, and writes bitstream to `storage/evidence/`.
3. Merkle engine slices file into 4096-byte chunks, computes leaf hashes and root digest.
4. `MongoManager` inserts evidence document into MongoDB `evidence` collection.
5. `custody.py` inserts initial custody event linking to Genesis hash.
6. Blockchain connector anchors hashes on-chain or executes database fallback anchor.
7. Background analysis job dispatched.

### Verification Flow
1. Examiner submits candidate copy to `/api/v1/evidence/:id/verify`.
2. System computes candidate hashes and compares against baseline.
3. If hashes diverge, Merkle block comparison isolates exact differing 4096-byte sectors.
4. Error Level Analysis (ELA) generates visual heatmap identifying modified regions.
5. Verification record persisted in database and returned to examiner.
