# ForenSight — Digital Forensics & NoSQL Database Platform

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.14-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0%20WiredTiger-47A248.svg)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-18%20%7C%2019-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com/)
[![Compliance](https://img.shields.io/badge/Legal-BSA%20Sec%2063(4)%20%7C%20ISO%2027037-amber.svg)](https://www.indiacode.nic.in/)

**ForenSight** is a database-driven Digital Forensics Investigation Platform engineered for comprehensive evaluation by both a **Digital Forensics Faculty Member** and a **NoSQL Database Systems Faculty Member**.

---

## Academic Evaluation Portals

| Evaluation Track | Primary Views in Application | Academic Reference Guide |
| :--- | :--- | :--- |
| **NoSQL Database Track** | `/database` (Database Inspector), `/cases`, `/evidence` | [`docs/NOSQL_EVALUATION_GUIDE.md`](docs/NOSQL_EVALUATION_GUIDE.md) |
| **Digital Forensics Track** | `/register`, `/verify`, `/analysis`, `/custody`, `/timeline`, `/reports` | [`docs/FORENSIC_METHODOLOGY.md`](docs/FORENSIC_METHODOLOGY.md) |
| **System Architecture** | `/settings`, Architecture Blueprint | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |

---

## 1. Key Capabilities

### A. Digital Forensics Engineering
1. **Deterministic Merkle Block Slicing:** Slices file bitstreams into 4096-byte blocks, computes leaf digests and Merkle root, and pinpoints exact physical byte offsets of tampering.
2. **Multi-Algorithm Cryptographic Hashing:** Computes MD5, SHA-1, and SHA-256 simultaneously using 64 KB memory-buffered streams ($O(1)$ RAM complexity).
3. **5-Part Forensic Diagnostic Core:**
   - **Check 1:** Multi-hash divergence and cross-algorithm integrity check.
   - **Check 2:** Binary magic bytes inspection and file extension spoofing guard.
   - **Check 3:** EXIF, GPS decimal coordinates, and PDF document metadata extraction.
   - **Check 4:** Error Level Analysis (ELA) recompression delta with OpenCV false-color heatmaps (`cv2.COLORMAP_JET`).
   - **Check 5:** Temporal inversion heuristics (modified prior to creation) and future anachronisms.
4. **Append-Only Hash-Chained Custody:** Cryptographically links every handover event via SHA-256 parent-child hash chaining.
5. **Continuous Integrity Watchdog Daemon:** Scans storage files every 30 seconds and broadcasts Server-Sent Events (SSE) upon byte deviation.
6. **Statutory Admissibility Reports:** Automatic ReportLab PDF generation fulfilling Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023 (BSA).

### B. NoSQL Database Architecture (MongoDB)
1. **8 BSON Document Collections:** `cases`, `evidence`, `custodyEvents`, `analysisJobs`, `findings`, `auditLogs`, `watchdogAudits`, `users`.
2. **Pragmatic Embedding vs. Referencing:** Embedded Merkle blocks for single-seek reads; referenced cases and custody events to prevent unbounded document growth.
3. **Compound & Unique Indexes:** Indexes such as `[("caseId", 1), ("acquisitionTimestamp", -1)]` that eliminate in-memory sorting (`SORT` stage) and guarantee $O(\log N)$ retrieval.
4. **Interactive Query Explain Runner (`.explain()`):** Live UI tool displaying execution stages (`IXSCAN` vs `COLLSCAN`), keysExamined, docsExamined, and winning plan JSON.
5. **Multi-Stage Aggregation Pipelines:** Demonstrates `$group`, `$facet`, `$sort`, and `$project` computing multi-dimensional forensic metrics.
6. **Dual-Mode Operational Engine:** Seamlessly connects to live MongoDB (Community/Atlas) or automatically falls back to an embedded in-memory engine with atomic disk-sync (`storage/forensight_nosql_data.json`) for zero-configuration grading.

---

## 2. Complete Frontend Architecture (15 Routes)

### Public & Onboarding
- **Public Product Homepage (`/`):** Editorial entry point with product overview, technical trace diagram, 5-stage investigation lifecycle, and capability audit.
- **Guided Investigation Wizard (`/workspace/new`):** 5-step stateful wizard guiding first-time users through case creation, bitstream registration, SHA-256 baseline calculation, diagnostic analysis, and report generation.

### Investigation Workspace (`/workspace`)
- **Workspace Landing (`/workspace`):** Focused investigation overview with 4 live server-backed metrics, quick-action tiles, recent cases, action items, and interactive onboarding tour.
- **Investigations (`/cases`):** Searchable case repository with status and priority filters; answers *"What cases am I working on?"*
- **Evidence Repository (`/evidence`):** Filter by case and integrity status; answers *"What evidence do I have, and can its integrity be verified?"*
- **Evidence Detail (`/evidence/:id`):** Multi-tab deep inspection with multi-hashes, 5-check diagnostic findings, Merkle block manifest, and custody history.
- **Acquisition Intake (`/register`):** Single-file bitstream intake with multi-algorithm hashing and Merkle tree generation.
- **Reports & Certificates (`/reports`):** Compiles persisted investigation records into statutory Section 63(4) BSA compliance PDF reports; answers *"Can I produce a report that explains this investigation?"*

### Forensic Tools
- **Integrity Verification (`/verify`):** Cryptographic comparison against stored baseline SHA-256 with byte offset diffs and ELA heatmaps; answers *"Does this file still match its recorded baseline hash?"*
- **Forensic Artifact Analysis (`/analysis`):** Automated diagnostic job queue with strict separation of machine observations from investigator conclusions; answers *"What can I learn from this evidence?"*
- **Chain of Custody Ledger (`/custody`):** Append-only cryptographic handover ledger with parent-child hash verification; answers *"Who handled this evidence, and when?"*
- **Unified Incident Timeline (`/timeline`):** Correlates artifact timestamps (EXIF, filesystem) with custody handovers; answers *"What happened, and when did it occur during this incident?"*

### System & Database Observability
- **Database & Diagnostics (`/database`):** Dedicated NoSQL evaluation panel displaying collection counts, compound index justifications, explain plans (`.explain()`), and aggregation pipelines.
- **System Audit Log (`/audit`):** Real-time administrative and operational audit trail backed by MongoDB `auditLogs`.
- **Academic Documentation (`/docs`):** In-app reference manuals covering Digital Forensics Methodology and NoSQL Database Architecture.
- **Integrity Watchdog (`/watchdog`):** Real-time monitoring of continuous storage integrity scans.
- **System Diagnostics & Settings (`/settings`):** Hardware diagnostics, storage directories, and synthetic demo dataset seeder.

---

## 3. Quickstart & Installation

### Option 1: Docker Compose (All Services with Live MongoDB)
Ensure Docker Desktop is running, then execute:
```powershell
docker compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API Docs: `http://localhost:8000/docs`
- MongoDB: `localhost:27017`

---

### Option 2: Local Development Setup

#### Prerequisites
- Python 3.11+ (Python 3.14 verified)
- Node.js 18+ (Node 24 verified) and npm

#### Step 1: Install Python Dependencies
```powershell
pip install -r backend/requirements.txt
```

#### Step 2: (Optional) Run Local Blockchain or Live MongoDB
- MongoDB: Start a local daemon on port 27017, or let ForenSight use its built-in persistent disk-synced fallback engine.
- Blockchain: If Ganache/Hardhat is offline, ForenSight automatically activates its secure database fallback anchor.

#### Step 3: Run Automated Test Suite
```powershell
$env:PYTHONPATH="backend"
python -m pytest backend/tests/ -v
```
*All 13 automated tests validate hashing, Merkle proofs, 5-check diagnostics, MongoDB collections, indexes, explain plans, and aggregation pipelines.*

#### Step 4: Start FastAPI Backend
```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger API documentation: `http://127.0.0.1:8000/docs`

#### Step 5: Start React Frontend
In a separate terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 4. Evaluation Guide for Faculty Reviewers

### For the NoSQL Database Evaluator
1. Open `http://localhost:5173/database` in your browser.
2. Review the **Collections & Storage** tab: 8 collections, document counts, and BSON sizing.
3. Review the **Compound Indexes** tab: inspect key specifications and academic justifications.
4. Click the **Live Query Explain** tab: click "Preset: Case Evidence Timeline" and click **Execute .explain()**. Verify that the winning stage is `IXSCAN` using compound index `idx_case_acq` with `docsExamined == keysExamined` and 0ms in-memory sort penalty.
5. Click the **Aggregation Pipeline Demo** tab: execute the live pipeline to see `$facet`, `$group`, and `$sort` computing metrics simultaneously.
6. Refer to [`docs/NOSQL_EVALUATION_GUIDE.md`](docs/NOSQL_EVALUATION_GUIDE.md) for full theoretical proofs and schema designs.

### For the Digital Forensics Evaluator
1. Open `http://localhost:5173/register` and upload a file from `demo_fixtures/`.
2. Inspect the 5-part forensic checks in `/analysis`.
3. Open `http://localhost:5173/verify` and select a candidate file to view the Merkle block diff and ELA heatmap.
4. Open `http://localhost:5173/custody` and click **Verify Custody Chain** to validate parent-child SHA-256 linkages.
5. Open `http://localhost:5173/reports` to inspect the Section 63(4) Bharatiya Sakshya Adhiniyam certificate and download the official PDF.
6. Refer to [`docs/FORENSIC_METHODOLOGY.md`](docs/FORENSIC_METHODOLOGY.md) for full algorithmic formulations.

---

## 5. Automated Test Results Summary

```text
backend/tests/test_api.py::test_api_health PASSED
backend/tests/test_api.py::test_acquire_and_verify_pipeline PASSED
backend/tests/test_api.py::test_watchdog_detects_storage_tampering PASSED
backend/tests/test_api.py::test_chain_of_custody_tamper_detection PASSED
backend/tests/test_api.py::test_pdf_report_generation PASSED
backend/tests/test_core.py::test_multi_hash_calculation PASSED
backend/tests/test_core.py::test_merkle_tree_consistency_and_proof PASSED
backend/tests/test_core.py::test_file_identity_and_extension_spoofing PASSED
backend/tests/test_core.py::test_tamper_localization_diff PASSED
backend/tests/test_mongodb.py::test_mongodb_initialization_and_indexes PASSED
backend/tests/test_mongodb.py::test_mongodb_crud_operations PASSED
backend/tests/test_mongodb.py::test_mongodb_aggregation_pipeline PASSED
backend/tests/test_mongodb.py::test_mongodb_explain_plan PASSED
============================== 13 passed in 70.89s ==============================
```

---

## 6. License & Academic Integrity

Developed for academic demonstration and evaluation in Digital Forensics and Advanced NoSQL Database Systems. Licensed under the MIT License.
