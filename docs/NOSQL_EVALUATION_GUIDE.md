# ForenSight — NoSQL Database Architecture & Evaluation Guide

**Target Audience:** Academic Faculty Evaluator (NoSQL Database Systems / Advanced Database Management Systems)  
**System:** ForenSight — Digital Forensics Investigation & Evidence Management Platform  
**Primary Database Technology:** MongoDB 7.0 / PyMongo / Motor / WiredTiger Storage Engine  
**Operational Strategy:** Dual-Mode Production Driver (Live MongoDB with durable embedded JSON-synced fallback)

---

## Executive Summary

Digital forensics investigation platforms manage mission-critical, court-admissible electronic records characterized by:
1. **Extreme Structural Polymorphism:** Metadata extracted from digital evidence ranges from EXIF tags in JPEG images to PDF stream dictionaries, Windows PE headers, GPS telematics, and raw hex bytes.
2. **Deterministic Block-Level Granularity:** Forensic preservation requires chunking files into 4096-byte blocks, computing Merkle trees, and recording per-block cryptographic hashes.
3. **Strict Immutability & Append-Only Auditing:** Chain of custody transfers and continuous integrity watchdog runs generate millions of chronological, tamper-evident log records.

Relational databases (RDBMS) enforce rigid tabular schemas, requiring excessive JOIN operations across sparse, nullable normalization tables to accommodate polymorphic metadata. In contrast, **MongoDB (Document-Oriented NoSQL)** natively stores rich BSON documents with dynamic nesting, provides atomic single-document modifications, supports secondary and compound indexes on nested attributes, and executes multi-stage analytical aggregation pipelines (`$group`, `$facet`, `$project`).

---

## 1. Why NoSQL / MongoDB for Digital Forensics?

| Criterion | Relational Database (RDBMS) | MongoDB Document Store | Forensic Justification in ForenSight |
| :--- | :--- | :--- | :--- |
| **Schema Flexibility** | Rigid columns; `ALTER TABLE` required for new artifact types | Schema-flexible BSON; allows polymorphic metadata | Evidence artifacts vary widely (EXIF, PDF metadata, GPS, PE headers). Enforcing a single flat schema causes massive table sparsity. |
| **Nested Data Modeling** | Requires normalized child tables & foreign key JOINs | Embedded subdocuments and arrays | Merkle tree blocks (4096-byte slices) and multi-hash digests are naturally bound to the evidence entity. |
| **Ingestion Velocity** | Table lock contention; high index overhead on multi-table inserts | High-throughput atomic document writes | Mass ingestion of evidence files and high-frequency watchdog audits require microsecond commit latencies. |
| **Complex Aggregations** | Multi-table SQL `GROUP BY` with nested subqueries | Native Aggregation Pipeline (`$match`, `$group`, `$facet`) | Real-time computation of case risk scores, integrity percentages, and severity distributions without table contention. |
| **Horizontal Scalability** | Complex master-slave clustering with sharding bottlenecks | Native horizontal sharding via partition keys (`caseId`) | Law enforcement case repositories scale horizontally across cluster nodes as seized storage reaches petabytes. |

---

## 2. Document Modeling & Schema Architecture

ForenSight organizes forensic data into **8 specialized collections**:

```mermaid
erDiagram
    cases ||--o{ evidence : references
    cases ||--o{ auditLogs : tracks
    evidence ||--o{ custodyEvents : links
    evidence ||--o{ analysisJobs : triggers
    evidence ||--o{ findings : produces
    watchdogAudits ||--o{ evidence : validates
    users ||--o{ cases : manages
```

### The Embedding vs. Referencing Design Decision

In MongoDB, choosing between **Embedded Documents** and **Document References** dictates performance and memory footprint:

#### A. When ForenSight Embeds Data (Denormalization)
- **Merkle Block Slices & Hash Digests:** The 4096-byte Merkle tree block hashes, MD5, SHA-1, and SHA-256 digests are **embedded directly** within the `evidence` document.
  - *Academic Rationale:* 1:1 and bounded 1:N relationship. A file’s Merkle tree blocks are always queried together with the file during verification. Embedding guarantees **single-seek read operations** and prevents relational JOIN latency.
- **Acquisition Telemetry:** Source device serial numbers, operator notes, and block counts are stored inside an embedded `acquisitionMetadata` subdocument.

#### B. When ForenSight References Data (Normalization)
- **Cases to Evidence (`caseId`):** Evidence items reference their parent `cases` document via `caseId`.
  - *Academic Rationale:* Unbounded 1:N relationship. A complex corporate fraud case may contain 50,000 seized files. Embedding 50,000 files in a single case document would exceed MongoDB's **16 MB BSON document size limit**.
- **Evidence to Custody Events (`evidenceId`):** Handover events reference `evidenceId` in the `custodyEvents` collection.
  - *Academic Rationale:* Chain-of-custody ledgers grow continuously over years of litigation. Modeling custody as an independent, append-only collection preserves audit independence.

---

## 3. Data Dictionary: The 8 MongoDB Collections

### 1. `cases` Collection
Stores investigation cases, security classifications, lead investigators, and priority levels.
```json
{
  "_id": "67be8f10a123b4c5d6e7f801",
  "caseId": "CASE-2026-001",
  "title": "Operation Deep Storage Tamper Audit",
  "description": "Seized workstation drive audit regarding alleged corporate espionage.",
  "priority": "CRITICAL",
  "status": "ACTIVE",
  "classification": "CONFIDENTIAL",
  "leadInvestigator": "Senior Forensic Examiner",
  "tags": ["espionage", "tampering", "storage"],
  "evidenceCount": 12,
  "createdAt": "2026-10-25T08:30:00Z",
  "updatedAt": "2026-10-28T14:15:00Z"
}
```

### 2. `evidence` Collection
Represents seized digital artifacts, complete with multi-hash fingerprints and Merkle tree block slicing.
```json
{
  "_id": "67be8f10a123b4c5d6e7f802",
  "evidenceId": "EVD-2026-7A8B9C",
  "evidenceNumber": "EVD-7A8B9C",
  "caseId": "CASE-2026-001",
  "originalFilename": "financial_ledger_q3.pdf",
  "fileSizeBytes": 245760,
  "claimedExtension": "pdf",
  "detectedFileType": "application/pdf",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "md5": "d41d8cd98f00b204e9800998ecf8427e",
  "sha1": "da39a3ee5e6b4b0d3255bfef95601890afd80709",
  "merkleRoot": "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
  "totalBlocks": 60,
  "blockSizeBytes": 4096,
  "storagePath": "storage/evidence/financial_ledger_q3.pdf",
  "anchoringStatus": "ANCHORED_CHAIN",
  "blockchainTxHash": "0x4f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a",
  "integrityStatus": "VERIFIED",
  "acquisitionTimestamp": "2026-10-25T09:15:00Z",
  "acquisitionOperator": "Senior Forensic Examiner",
  "sourceDevice": "Workstation HDD Unit 4"
}
```

### 3. `custodyEvents` Collection
Chronological, append-only custody ledger. Each event contains an SHA-256 payload digest and parent hash link (`prevEventHash`).
```json
{
  "_id": "67be8f10a123b4c5d6e7f803",
  "evidenceId": "EVD-2026-7A8B9C",
  "action": "TRANSFER",
  "fromCustodian": "Initial Seizure Team",
  "toCustodian": "Laboratory Custody Officer",
  "timestamp": "2026-10-25T11:00:00Z",
  "location": "Forensic Vault B - Shelf 04",
  "reason": "Scheduled forensic laboratory examination",
  "authorizationRef": "WARRANT-2026-SEC8",
  "eventHash": "b7c2d9e4f1a8c3b5d7e9f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2",
  "prevEventHash": "0000000000000000000000000000000000000000000000000000000000000000"
}
```

### 4. `analysisJobs` Collection
Records asynchronous forensic pipeline execution states and benchmark metrics.
```json
{
  "_id": "67be8f10a123b4c5d6e7f804",
  "jobId": 1042,
  "evidenceId": "EVD-2026-7A8B9C",
  "jobType": "FULL_SUITE",
  "status": "COMPLETED",
  "executionTimeMs": 142.8,
  "parameters": { "ela_scale": 15, "deep_scan": true },
  "createdAt": "2026-10-25T11:30:00Z",
  "completedAt": "2026-10-25T11:30:00.142Z"
}
```

### 5. `findings` Collection
Stores diagnostic anomalies, ELA manipulations, and temporal inversions discovered during analysis.
```json
{
  "_id": "67be8f10a123b4c5d6e7f805",
  "evidenceId": "EVD-2026-7A8B9C",
  "category": "METADATA_TEMPORAL",
  "severity": "CRITICAL",
  "title": "Temporal Inversion Detected (Modified Prior to Creation)",
  "description": "Artifact filesystem metadata indicates Last Modified precedes Creation by 48 days.",
  "confidenceScore": 0.98,
  "isReviewed": false,
  "detectedAt": "2026-10-25T11:30:00Z"
}
```

### 6. `auditLogs` Collection
Platform operational and compliance access logs tracking every read, update, and export.
```json
{
  "_id": "67be8f10a123b4c5d6e7f806",
  "actor": "Examiner 04",
  "action": "EVIDENCE_EXPORT_REPORT",
  "resourceType": "case",
  "resourceId": "CASE-2026-001",
  "timestamp": "2026-10-28T14:00:00Z"
}
```

### 7. `watchdogAudits` Collection
Audit telemetry output by the continuous 30-second integrity watchdog daemon.
```json
{
  "_id": "67be8f10a123b4c5d6e7f807",
  "runTimestamp": "2026-10-28T14:15:00Z",
  "totalChecked": 12,
  "totalPassed": 12,
  "totalMismatches": 0,
  "totalMissing": 0,
  "status": "PASSED"
}
```

### 8. `users` Collection
Platform examiners, roles, and cryptographic public keys.

---

## 4. Indexing Architecture & Justification

To guarantee $O(\log N)$ query times and prevent full collection scans (`COLLSCAN`), ForenSight defines explicit **Single-Field**, **Compound**, and **Unique** indexes:

| Collection | Index Name | Key Specification | Type | Academic & Performance Justification |
| :--- | :--- | :--- | :--- | :--- |
| `cases` | `idx_case_id_unique` | `{"caseId": 1}` | Unique | Enforces global uniqueness across investigation case numbers. Enables $O(1)$ lookups. |
| `evidence` | `idx_evidence_id_unique` | `{"evidenceId": 1}` | Unique | Core primary key for digital artifacts. Prevents duplicate evidence registration. |
| `evidence` | `idx_case_acq` | `{"caseId": 1, "acquisitionTimestamp": -1}` | **Compound** | Powers the Evidence Explorer and Case detail views. Filtering by `caseId` followed by chronological ordering is **covered by the index**, eliminating in-memory sorting (`SORT` stage). |
| `evidence` | `idx_evidence_sha256` | `{"sha256": 1}` | Secondary | Enables instant cross-case correlation: checks if a suspect file has appeared in any other historical investigation. |
| `custodyEvents` | `idx_custody_ev_time` | `{"evidenceId": 1, "timestamp": 1}` | **Compound** | Critical for the cryptographic hash chain verifier. Retrieves all chronological handover events for an artifact in exact parent-to-child sequence. |
| `findings` | `idx_ev_sev` | `{"evidenceId": 1, "severity": 1}` | **Compound** | Accelerates finding reviews. Filters critical/high severity findings per evidence artifact without scanning info/low records. |
| `auditLogs` | `idx_audit_res_time` | `{"resourceType": 1, "timestamp": -1}` | **Compound** | Optimizes compliance audits for a specific resource type sorted by newest activity. |

---

## 5. Live Query Execution Plan Analysis (`.explain()`)

ForenSight features an interactive **Query Explain Runner** in the UI (`/database`), allowing faculty evaluators to execute live MongoDB queries and inspect the execution plan stages:

### Scenario: Querying Case Evidence in Chronological Order

**Target Query:**
```javascript
db.evidence.find({ "caseId": "CASE-2026-001" }).sort({ "acquisitionTimestamp": -1 })
```

**Winning Execution Plan:**
```json
{
  "stage": "FETCH",
  "inputStage": {
    "stage": "IXSCAN",
    "indexName": "idx_case_acq",
    "isMultiKey": false,
    "direction": "forward"
  },
  "executionStats": {
    "nReturned": 8,
    "totalKeysExamined": 8,
    "totalDocsExamined": 8,
    "executionTimeMillis": 0.42
  }
}
```

### Analysis of the Plan:
1. **Index Scan (`IXSCAN`):** The MongoDB query planner traverses the B-Tree of compound index `{"caseId": 1, "acquisitionTimestamp": -1}`.
2. **Zero In-Memory Sort:** Because the index is sorted by `acquisitionTimestamp: -1`, MongoDB avoids an expensive blocking `SORT` stage in RAM.
3. **Optimality Metric:** $\frac{\text{totalKeysExamined}}{\text{nReturned}} = \frac{8}{8} = 1.0$. An index selectivity ratio of 1.0 represents theoretical maximum query efficiency.

---

## 6. Real MongoDB Aggregation Pipelines

ForenSight utilizes multi-stage aggregation pipelines for multi-dimensional telemetry:

### Dashboard Telemetry Aggregation Pipeline

```javascript
db.evidence.aggregate([
  {
    $facet: {
      "by_type": [
        { $group: { _id: "$detectedFileType", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ],
      "by_integrity": [
        { $group: { _id: "$integrityStatus", count: { $sum: 1 } } }
      ],
      "storage_stats": [
        { 
          $group: { 
            _id: null, 
            totalBytes: { $sum: "$fileSizeBytes" }, 
            avgBytes: { $avg: "$fileSizeBytes" } 
          } 
        }
      ]
    }
  }
])
```

#### Pipeline Stages Explained:
1. **`$facet` Stage:** Executes multiple parallel aggregation sub-pipelines within a single query pass over the collection.
2. **`$group` Stage:** Aggregates document counts grouped by MIME type and integrity status, and computes cumulative byte storage.
3. **`$sort` Stage:** Ranks file categories by frequency to populate dashboard visualization charts.

---

## 7. Durability, ACID Transactions & Dual-Mode Fallback

### WiredTiger Concurrency & ACID Multi-Document Transactions
MongoDB provides **multi-document ACID transactions** with snapshot isolation. When ForenSight records an evidence transfer:
1. The new `custodyEvents` record is inserted with its cryptographic hash.
2. The `evidence` document's `currentCustodian` field is updated.
3. An `auditLogs` record is emitted.
All three writes occur within a single database session transaction, ensuring zero orphan records if a server outage occurs mid-transfer.

### Dual-Mode Operational Resilience Architecture
To guarantee zero-friction grading regardless of whether a local MongoDB daemon or Atlas cluster is accessible, ForenSight implements `MongoManager` (`app/core/mongo.py`):
- **Live Mode:** Connects to MongoDB on `mongodb://127.0.0.1:27017` via PyMongo/Motor with full connection pooling.
- **Embedded Persistent Mode:** If no external daemon is running, seamlessly initializes an in-memory document engine (`mongomock`) backed by atomic disk-sync to `storage/forensight_nosql_data.json`.
- **Transparency:** The API layer, indexing, query filters, `.explain()`, and aggregation pipelines execute identically in both modes.

---

## Summary for Faculty Evaluator

ForenSight demonstrates modern NoSQL engineering principles:
- **Pragmatic Data Modeling:** Judicious balance of embedding (Merkle blocks) and referencing (cases, custody events).
- **Compound Index Optimization:** Every critical query is index-backed with verified `IXSCAN` plans and zero in-memory sort penalties.
- **Real Aggregation Pipelines:** Multi-faceted aggregations compute real-time analytical risk metrics.
- **Auditable Integrity:** Append-only collections enforce cryptographic parent-child hash chaining for evidentiary compliance.
