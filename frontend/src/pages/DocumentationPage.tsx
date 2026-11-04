import React, { useState } from 'react';
import { 
  BookOpen, 
  Shield, 
  Database, 
  Cpu, 
  FileText, 
  Hash, 
  Layers, 
  CheckCircle2, 
  Award,
  Terminal,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DocumentationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'FORENSICS' | 'NOSQL'>('FORENSICS');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-sky-400" />
            Platform Documentation & Evaluation Reference
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Academic specifications, algorithmic formulations, and NoSQL schema design justifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/database"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            Launch Database Inspector
          </Link>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('FORENSICS')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'FORENSICS'
              ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Digital Forensics Methodology</span>
        </button>

        <button
          onClick={() => setActiveTab('NOSQL')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'NOSQL'
              ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>NoSQL Database Architecture</span>
        </button>
      </div>

      {/* Tab 1: Digital Forensics Methodology */}
      {activeTab === 'FORENSICS' && (
        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-400" />
              1. Evidentiary Invariants & Bitstream Preservation
            </h2>
            <p>
              ForenSight adheres strictly to ISO/IEC 27037:2012 guidelines for the handling and preservation of digital evidence. Original bitstreams are never written directly into database documents; rather, they are streamed into secure repository partitions with independent read-only file permissions.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
              <div>• Single-Pass Multi-Hashing: MD5, SHA-1, and SHA-256 computed simultaneously using 64 KB buffers.</div>
              <div>• Deterministic 4096-Byte Slicing: Merkle tree block chunking guarantees sub-sector tamper localization.</div>
              <div>• $O(1)$ Memory Overhead: Streamed ingestion prevents RAM exhaustion on multi-gigabyte forensic images.</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              2. Autonomous 5-Part Diagnostic Forensic Core
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-semibold text-white">Check 1: Cryptographic Multi-Hashing</div>
                <p className="text-slate-400">
                  Cross-validates MD5, SHA-1, and SHA-256 digests. Eliminates theoretical hash collision risks by requiring triple-algorithm concordance.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-semibold text-white">Check 2: Binary File Identity & Magic Bytes</div>
                <p className="text-slate-400">
                  Validates raw leading header bytes (e.g. `%PDF`, `FF D8 FF`, `MZ`, `PK..`) against claimed file extensions to unmask disguised executables.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-semibold text-white">Check 3: EXIF, GPS & Office Metadata Extraction</div>
                <p className="text-slate-400">
                  Extracts embedded camera metadata, decimal GPS coordinates, serial numbers, and PDF document creator dictionaries.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-semibold text-white">Check 4: Error Level Analysis (ELA) Heatmaps</div>
                <p className="text-slate-400">
                  Recompresses images at 95% quality, calculates the absolute pixel delta matrix, scales by 15×, and generates OpenCV false-color heatmaps.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 md:col-span-2">
                <div className="font-semibold text-white">Check 5: Temporal Inversion & Anachronism Detection</div>
                <p className="text-slate-400">
                  Heuristic rules detect timestamp paradoxes (e.g. File Modified timestamp preceding Creation timestamp) or future-dated metadata.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              3. Statutory Legal Admissibility (BSA Section 63(4))
            </h2>
            <p>
              Section 63(4) of the <strong>Bharatiya Sakshya Adhiniyam, 2023 (BSA)</strong> (formerly Section 65B of the Indian Evidence Act, 1872) mandates that electronic records submitted to court be certified by an authorized examiner attesting that the computer operated normally throughout the operational period without tampering.
            </p>
            <p>
              ForenSight compiles official PDF certificates affixing acquisition timestamps, SHA-256 hashes, Merkle roots, and watchdog verification stamps directly into legal reports.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: NoSQL Database Architecture */}
      {activeTab === 'NOSQL' && (
        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              1. Theoretical Rationale for MongoDB / NoSQL
            </h2>
            <p>
              Digital forensics metadata exhibits high polymorphism: EXIF tags, PDF stream dictionaries, GPS decimal coordinates, and Merkle block arrays vary widely across media types. In an RDBMS, this causes massive table sparsity or complex multi-table JOINs.
            </p>
            <p>
              MongoDB's flexible BSON document model allows dynamic nesting of per-artifact metadata, embedded 4096-byte Merkle block slices, and compound secondary indexes on nested keys without requiring table lock migrations.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              2. Embedding vs. Referencing Design Patterns
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="font-semibold text-emerald-400">Embedded Subdocuments (Denormalization)</div>
                <p className="text-slate-400">
                  Applied to <strong>Merkle Tree Blocks & Hash Fingerprints</strong> in the `evidence` collection. Because block hashes are always read together during verification, embedding guarantees single-seek retrieval and zero JOIN overhead.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="font-semibold text-emerald-400">Document References (Normalization)</div>
                <p className="text-slate-400">
                  Applied between <strong>Cases and Evidence (`caseId`)</strong> and <strong>Evidence and Custody Events (`evidenceId`)</strong>. Unbounded 1:N growth prevents exceeding MongoDB's 16 MB document size limit.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              3. Compound Indexes & Live Execution Plan Analysis
            </h2>
            <p>
              Compound indexes such as <code className="text-emerald-400 font-mono">idx_case_acq: [("caseId", 1), ("acquisitionTimestamp", -1)]</code> ensure that queries filtering by case and sorted reverse-chronologically are completely covered by the index.
            </p>
            <p>
              Using the <Link to="/database" className="text-sky-400 hover:underline">Database Inspector</Link>, evaluators can run live <code className="text-emerald-400 font-mono">.explain('executionStats')</code> queries to confirm winning plan stages are <code className="text-emerald-400">IXSCAN</code> with zero in-memory sorting penalties.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
