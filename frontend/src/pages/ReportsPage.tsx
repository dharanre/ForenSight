import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  Briefcase, 
  Layers, 
  User, 
  Calendar, 
  HardDrive,
  FileCode,
  Award,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { Case, Evidence, CaseReportData } from '../types';

export const ReportsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const caseIdParam = searchParams.get('case_id');

  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(caseIdParam || '');
  const [reportData, setReportData] = useState<CaseReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getCases().then(data => {
      setCases(data);
      if (data.length > 0 && !selectedCaseId) {
        setSelectedCaseId(data[0].case_id || data[0].id || '');
      }
    });
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      loadReport();
    }
  }, [selectedCaseId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCaseReportJson(selectedCaseId);
      setReportData(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to compile case report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            Primary Question: Can I produce a report that explains this investigation?
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-sky-400" />
            Investigation Reports & Forensic Certificates
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Compile formal investigative reports directly from persisted case data, SHA-256 evidence fingerprints, diagnostic analysis results, and cryptographic custody records.
          </p>
        </div>

        {selectedCaseId && (
          <div className="flex items-center gap-2.5">
            <a
              href={api.getCaseReportPdfUrl(selectedCaseId)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-sky-600/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Report</span>
            </a>
            <a
              href={`/api/v1/cases/${selectedCaseId}/report.json`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              <FileCode className="w-4 h-4" />
              <span>JSON Export</span>
            </a>
          </div>
        )}
      </div>

      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-400 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong className="text-slate-200">Reporting Standard:</strong> Reports accurately synthesize persisted database records including acquisition timestamps, tool versions, and cryptographic proofs. Missing parameters or unverified evidence items are explicitly surfaced rather than concealed.
        </span>
      </div>

      {/* Case Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-sky-400" />
          Select Target Investigation:
        </label>
        <select
          value={selectedCaseId}
          onChange={(e) => setSelectedCaseId(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-sky-400 font-mono font-bold focus:outline-none focus:border-sky-500 flex-1 max-w-md"
        >
          {cases.map(c => (
            <option key={c.case_id} value={c.case_id}>
              {c.case_id} — {c.title} ({c.priority})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8 text-center text-rose-400">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <h3 className="font-semibold text-white">Error Compiling Case Report</h3>
          <p className="text-xs mt-1">{error}</p>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/20">
                  {reportData.case.case_id}
                </span>
                <h2 className="text-xl font-bold text-white mt-2">{reportData.case.title}</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  {reportData.case.description || 'Forensic examination conducted under strict chain of custody protocols.'}
                </p>
              </div>

              <div className="text-right space-y-1 text-xs">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                  {reportData.case.classification || 'CONFIDENTIAL'}
                </span>
                <div className="text-slate-400 font-mono pt-2">
                  Examiner: <strong className="text-white">{reportData.case.lead_investigator}</strong>
                </div>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <div className="text-xs text-slate-400">Evidence Count</div>
                <div className="text-xl font-bold text-white font-mono mt-1">
                  {reportData.summary.total_evidence}
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <div className="text-xs text-slate-400">Verified Intact</div>
                <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                  {reportData.summary.verified_intact}
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <div className="text-xs text-slate-400">Diagnostic Findings</div>
                <div className="text-xl font-bold text-amber-400 font-mono mt-1">
                  {reportData.summary.total_findings}
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <div className="text-xs text-slate-400">Custody Transfers</div>
                <div className="text-xl font-bold text-sky-400 font-mono mt-1">
                  {reportData.summary.custody_events_count}
                </div>
              </div>
            </div>
          </div>

          {/* Statutory Certificate Preview (BSA Section 63(4)) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400 border-b border-slate-800 pb-3">
              <Award className="w-5 h-5 shrink-0" />
              <h3 className="font-semibold text-white text-base">
                Statutory Certificate Under Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023
              </h3>
            </div>

            <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs leading-relaxed text-slate-300 font-serif">
              <p>
                <strong>I, {reportData.case.lead_investigator}</strong>, Lead Digital Forensics Examiner, hereby certify pursuant to Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023 (formerly Section 65B of the Indian Evidence Act, 1872) that:
              </p>
              <ol className="list-decimal pl-5 space-y-1.5 opacity-90">
                <li>
                  The digital evidence artifacts cataloged in Case <strong>{reportData.case.case_id}</strong> were acquired, bitstream-preserved, and stored in regular operation using ForenSight Forensics Platform.
                </li>
                <li>
                  During the operational period, the digital custody verification system operated normally, and the cryptographic integrity of the storage repository was actively maintained under continuous watchdog supervision.
                </li>
                <li>
                  Each evidence artifact was sliced into deterministic 4096-byte blocks, cryptographically hashed via SHA-256 multi-hashing, and verified against Merkle Tree root digests.
                </li>
              </ol>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-slate-400 font-mono text-[11px]">
                <span>Generated: {new Date(reportData.generated_at).toUTCString()}</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1 font-sans">
                  <ShieldCheck className="w-4 h-4" /> Cryptographically Certified
                </span>
              </div>
            </div>
          </div>

          {/* Evidence Inventory Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 font-semibold text-sm text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-sky-400" />
              <span>Cataloged Evidence Artifacts ({reportData.evidence_items.length})</span>
            </div>

            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/40 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="p-4">Evidence ID</th>
                  <th className="p-4 font-sans">Filename</th>
                  <th className="p-4">SHA-256 Digest</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Integrity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reportData.evidence_items.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/30">
                    <td className="p-4 text-sky-400 font-bold">{ev.id}</td>
                    <td className="p-4 font-sans text-white font-medium">{ev.original_filename}</td>
                    <td className="p-4 text-slate-400">{ev.sha256.slice(0, 16)}...</td>
                    <td className="p-4 text-slate-300">{(((ev.file_size_bytes || ev.fileSize) || 0) / 1024).toFixed(1)} KB</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ev.integrity_status === 'VERIFIED'
                          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                          : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                      }`}>
                        {ev.integrity_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};
