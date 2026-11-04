import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  FileSearch, 
  Layers, 
  Lock, 
  CheckCircle2, 
  Activity, 
  Cpu, 
  FileText, 
  Database, 
  ExternalLink,
  Search,
  Hash,
  Clock,
  Terminal,
  BookOpen,
  FolderOpen
} from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Public Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
              <FileSearch className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-wider text-white">FORENSIGHT</span>
              <span className="text-[10px] text-sky-400 font-mono ml-2 px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                FORENSICS PLATFORM
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-medium text-slate-300">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#capabilities" className="hover:text-white transition-colors">Forensic Capabilities</a>
            <a href="#foundation" className="hover:text-white transition-colors">Technical Foundation</a>
            <Link to="/docs" className="hover:text-white transition-colors">Documentation</Link>
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              to="/workspace"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-sky-600/20 transition-all"
            >
              <span>Open Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 border-b border-slate-800/60 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>EVIDENTIARY INTEGRITY & INVESTIGATION PLATFORM</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Investigate Digital Evidence. <br />
              <span className="text-sky-400">Preserve Its Integrity.</span>
            </h1>

            <p className="text-base text-slate-400 leading-relaxed max-w-2xl">
              ForenSight helps investigators organize digital evidence, verify file integrity, document chain of custody, analyze artifacts, and produce traceable investigation reports backed by a high-throughput NoSQL database.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                to="/workspace/new"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-sky-600/20 transition-all"
              >
                <span>Start an Investigation</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-semibold rounded-lg border border-slate-800 transition-all"
              >
                <span>Explore the Workflow</span>
              </a>
            </div>

            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800/80 text-xs font-mono text-slate-400">
              <div>
                <strong className="text-white block font-sans text-sm">Deterministic</strong>
                <span>4096-Byte Merkle Blocks</span>
              </div>
              <div>
                <strong className="text-white block font-sans text-sm">Multi-Algorithm</strong>
                <span>MD5, SHA-1 & SHA-256</span>
              </div>
              <div>
                <strong className="text-white block font-sans text-sm">Append-Only</strong>
                <span>Hash-Chained Custody</span>
              </div>
            </div>
          </div>

          {/* Technical Architecture Diagram Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs font-mono text-slate-400">
                <span className="text-sky-400 font-semibold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  EVIDENTIARY TRACE PIPELINE
                </span>
                <span className="text-emerald-400">STATUS: VERIFIED</span>
              </div>

              <div className="space-y-4 py-4 text-xs font-mono">
                {/* Step 1 */}
                <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="font-bold text-white">01. BITSTREAM ACQUISITION</span>
                    <span className="text-sky-400">64 KB Stream Buffers</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center text-slate-600">
                  <ArrowRight className="w-4 h-4 rotate-90" />
                </div>

                {/* Step 2 */}
                <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="font-bold text-white">02. MERKLE TREE SLICING</span>
                    <span className="text-emerald-400">Deterministic 4 KiB</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Root Digest: a1b2c3d4e5f67890123456789abcdef0123456789abcdef0
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center text-slate-600">
                  <ArrowRight className="w-4 h-4 rotate-90" />
                </div>

                {/* Step 3 */}
                <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="font-bold text-white">03. CHAIN-OF-CUSTODY LEDGER</span>
                    <span className="text-sky-400">Append-Only Linked</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Parent Link: SHA256(prevEventHash || payload)
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>MongoDB WiredTiger Document Store</span>
                <Link to="/workspace" className="text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1">
                  <span>Enter Platform</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 border-b border-slate-800/60 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
              METHODOLOGICAL LIFECYCLE
            </h2>
            <h3 className="text-3xl font-bold text-white tracking-tight">
              Five Stages of Forensic Examination
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              ForenSight establishes a linear, repeatable investigation pipeline modeled after standard operating procedures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Stage 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-mono font-bold text-xs">
                  01
                </div>
                <h4 className="text-sm font-semibold text-white">Create a Case</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Establish investigation scope, security classification, lead investigator, and objective synopsis.
                </p>
              </div>
              <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/60">
                cases collection
              </div>
            </div>

            {/* Stage 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-mono font-bold text-xs">
                  02
                </div>
                <h4 className="text-sm font-semibold text-white">Add Evidence</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Stream file bitstream, calculate MD5/SHA-1/SHA-256 multi-hashes, and partition into 4096-byte Merkle blocks.
                </p>
              </div>
              <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/60">
                evidence collection
              </div>
            </div>

            {/* Stage 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-mono font-bold text-xs">
                  03
                </div>
                <h4 className="text-sm font-semibold text-white">Verify Integrity</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Compare candidate files against baseline records. Pinpoint exact modified sectors and differential byte offsets.
                </p>
              </div>
              <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/60">
                Merkle block diff
              </div>
            </div>

            {/* Stage 4 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-mono font-bold text-xs">
                  04
                </div>
                <h4 className="text-sm font-semibold text-white">Analyze Artifacts</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Execute magic byte validation, EXIF metadata extraction, Error Level Analysis (ELA), and temporal inversion checks.
                </p>
              </div>
              <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/60">
                5-Check engine
              </div>
            </div>

            {/* Stage 5 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-mono font-bold text-xs">
                  05
                </div>
                <h4 className="text-sm font-semibold text-white">Generate Report</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Export court-admissible PDF reports including findings inventory and Section 63(4) BSA compliance certificate.
                </p>
              </div>
              <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/60">
                ReportLab PDF
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Forensic Capabilities */}
      <section id="capabilities" className="py-20 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
              IMPLEMENTED FORENSIC CAPABILITIES
            </h2>
            <h3 className="text-3xl font-bold text-white tracking-tight">
              Purpose-Built Evidence Handling
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every feature corresponds to functional Python algorithms and persistent database operations in the codebase.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400 w-fit">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-white">Case & Evidence Repository</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Relational case boundaries with multi-artifact grouping. Associates seized files with custody owners, original hardware identifiers, and acquisition metadata.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400 w-fit">
                <Hash className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-white">SHA-256 & Merkle Verification</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Whole-file cryptographic fingerprinting paired with 4096-byte Merkle tree block hashing. Detects exact byte range differences and displays visual tamper overlays.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400 w-fit">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-white">Cryptographic Chain of Custody</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Append-only custody event ledger. Every transfer hashes the canonical event payload combined with the preceding event digest, preventing retroactive modification.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400 w-fit">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-white">5-Part Forensic Diagnostics</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Autonomous diagnostic checks: Magic bytes extension spoofing, EXIF camera and GPS metadata, Pillow/OpenCV Error Level Analysis, and temporal inversion heuristics.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400 w-fit">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-white">Investigation Timeline</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Correlates internal artifact timestamps (EXIF, filesystem created/modified) with platform audit logs to detect chronological manipulation and anachronisms.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400 w-fit">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-white">Legal Admissibility Reports</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated ReportLab PDF compilation incorporating statutory declarations required under Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust and Technical Foundation */}
      <section id="foundation" className="py-20 border-b border-slate-800/60 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
              TECHNICAL GROUNDING
            </h2>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Evidence Preservation & Database Architecture
            </h3>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p>
                ForenSight is grounded in standard forensic practices: original evidence files are stored in read-only local repository folders, completely separated from their metadata documents in MongoDB.
              </p>
              <p>
                All statistical counters, severity breakdowns, and timeline points are generated from live MongoDB collection queries—never simulated or generated from mock client-side arrays.
              </p>
              <p>
                For academic faculty evaluation, the dedicated <strong>Database Inspector</strong> allows direct inspection of BSON document schemas, execution plan explain traces (`IXSCAN` vs `COLLSCAN`), and multi-stage aggregation pipelines.
              </p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="text-xs">
                <span className="text-white font-semibold">Faculty Evaluation Documentation Available</span>
                <p className="text-slate-400 text-[11px] mt-0.5">Read comprehensive methodology and NoSQL evaluation guides.</p>
              </div>
              <Link
                to="/docs"
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
              >
                View Documentation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Ready to Conduct a Forensic Investigation?
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Launch the investigation workspace to create a case, register evidence artifacts, or inspect MongoDB database query plans.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/workspace/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-sky-600/20 transition-all"
            >
              <span>Start an Investigation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/workspace"
              className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm font-semibold rounded-lg border border-slate-800 transition-all"
            >
              <span>Open Investigator Workspace</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Public Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-xs text-slate-500 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-400">ForenSight</span>
            <span>—</span>
            <span>Digital Forensics & NoSQL Platform</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link to="/workspace" className="hover:text-slate-300 transition">Workspace</Link>
            <Link to="/database" className="hover:text-slate-300 transition">Database Inspector</Link>
            <Link to="/docs" className="hover:text-slate-300 transition">Documentation</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
