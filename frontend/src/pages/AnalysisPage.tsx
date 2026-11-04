import React, { useEffect, useState } from 'react';
import { 
  Cpu, 
  Play, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  RefreshCw,
  Eye,
  Sliders,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { Evidence, AnalysisJob, ForensicFinding } from '../types';

export const AnalysisPage: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [findings, setFindings] = useState<ForensicFinding[]>([]);
  const [loading, setLoading] = useState(true);

  // Job Submission state
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>('');
  const [jobType, setJobType] = useState<string>('FULL_SUITE');
  const [launching, setLaunching] = useState(false);
  const [launchMessage, setLaunchMessage] = useState<string | null>(null);

  // Findings filter state
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'FINDINGS' | 'JOBS'>('FINDINGS');

  // Review modal state
  const [reviewModalFinding, setReviewModalFinding] = useState<ForensicFinding | null>(null);
  const [reviewerName, setReviewerName] = useState('Senior Forensic Examiner');
  const [reviewNotes, setReviewNotes] = useState('Confirmed anomaly in forensic artifact analysis.');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [evs, jbs, fnds] = await Promise.all([
        api.getEvidenceList(),
        api.getAnalysisJobs(),
        api.getFindings()
      ]);
      setEvidenceList(evs);
      setJobs(jbs);
      setFindings(fnds);
      if (evs.length > 0 && !selectedEvidenceId) {
        setSelectedEvidenceId(evs[0].id);
      }
    } catch (e) {
      console.error('Failed to load forensic analysis data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLaunchJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvidenceId) return;

    try {
      setLaunching(true);
      setLaunchMessage(null);
      const newJob = await api.createAnalysisJob({
        evidence_id: selectedEvidenceId,
        job_type: jobType,
        parameters: { ela_scale: 15, deep_scan: true }
      });
      setLaunchMessage(`Analysis job #${newJob.job_id} launched successfully.`);
      loadData();
      setActiveTab('JOBS');
    } catch (err: any) {
      setLaunchMessage(`Error: ${err?.response?.data?.detail || 'Job launch failed'}`);
    } finally {
      setLaunching(false);
    }
  };

  const handleReviewFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalFinding) return;

    try {
      setSubmittingReview(true);
      await api.reviewFinding(reviewModalFinding.id, reviewerName, reviewNotes);
      setReviewModalFinding(null);
      loadData();
    } catch (err) {
      console.error('Failed to review finding:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredFindings = findings.filter(f => {
    const matchesSearch =
      (f.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.evidence_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.category || '').toLowerCase().includes(search.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || f.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case 'LOW':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'RUNNING':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30 animate-pulse';
      case 'FAILED':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            Primary Question: What can I learn from this evidence?
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-sky-400" />
            Forensic Artifact Analysis
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Execute deterministic diagnostic pipelines across file bitstreams: file signature magic bytes, embedded EXIF/PDF metadata, Error Level Analysis (ELA), and anomaly detection.
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-400 flex items-start gap-2.5">
        <Eye className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong className="text-slate-200">Investigator Standard:</strong> Raw forensic observations (byte values, metadata fields, compression ratios) are strictly separated from investigator interpretations. Automated diagnostic detections are treated as indicators requiring confirmation rather than speculative conclusions.
        </span>
      </div>

      {/* Dispatch Job Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Play className="w-4 h-4 text-sky-400" />
          Launch New Forensic Analysis Pipeline
        </h2>

        <form onSubmit={handleLaunchJob} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Target Evidence Artifact</label>
            <select
              value={selectedEvidenceId}
              onChange={(e) => setSelectedEvidenceId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
            >
              {evidenceList.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.id} — {ev.original_filename} ({ev.case_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Diagnostic Pipeline Type</label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="FULL_SUITE">FULL_SUITE (All 5 Forensic Diagnostic Checks)</option>
              <option value="FILE_IDENTITY">FILE_IDENTITY (Magic Bytes & Format Extension)</option>
              <option value="METADATA_EXTRACTION">METADATA_EXTRACTION (EXIF, PDF Info & GPS)</option>
              <option value="MANIPULATION_ELA">MANIPULATION_ELA (Error Level Analysis Heatmap)</option>
              <option value="TIMELINE_ANOMALY">TIMELINE_ANOMALY (Inverted Timestamps & Anachronisms)</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={launching || !selectedEvidenceId}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-lg shadow-sky-600/20 transition cursor-pointer"
            >
              {launching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Analysis Job</span>
                </>
              )}
            </button>
          </div>
        </form>

        {launchMessage && (
          <div className="mt-3 p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{launchMessage}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('FINDINGS')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === 'FINDINGS'
              ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Diagnostic Findings ({findings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('JOBS')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === 'JOBS'
              ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Execution Jobs Queue ({jobs.length})</span>
        </button>
      </div>

      {/* Tab 1: Findings Table */}
      {activeTab === 'FINDINGS' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search findings by anomaly, evidence ID, or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
                <option value="INFO">Info</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {filteredFindings.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-white">No Diagnostic Findings Matching</h3>
                <p className="text-sm text-slate-400 mt-1">All processed evidence checks are clean or match active filter criteria.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {filteredFindings.map((f) => (
                  <div key={f.id} className="p-5 hover:bg-slate-800/30 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSeverityBadge(f.severity)}`}>
                          {f.severity}
                        </span>
                        <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                          {f.evidence_id}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {f.category}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-white">{f.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">{f.description}</p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 font-mono">
                        <span>Confidence: <strong>{((f.confidence_score ?? 1) * 100).toFixed(0)}%</strong></span>
                        <span>•</span>
                        <span>Detected: {f.detected_at || f.created_at ? new Date(f.detected_at || f.created_at || '').toLocaleString() : 'N/A'}</span>
                        {f.is_reviewed && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 flex items-center gap-1 font-sans">
                              <Check className="w-3 h-3" />
                              Reviewed by {f.reviewed_by}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {!f.is_reviewed ? (
                        <button
                          onClick={() => setReviewModalFinding(f)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
                        >
                          Sign Off
                        </button>
                      ) : (
                        <span className="px-3 py-1 text-xs text-emerald-400 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Jobs Queue Table */}
      {activeTab === 'JOBS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Job ID</th>
                <th className="p-4">Evidence ID</th>
                <th className="p-4 font-sans">Pipeline Suite</th>
                <th className="p-4">Status</th>
                <th className="p-4">Execution Time</th>
                <th className="p-4">Started At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {jobs.map((job) => (
                <tr key={job.job_id} className="hover:bg-slate-800/30 transition">
                  <td className="p-4 text-sky-400 font-bold">#{job.job_id}</td>
                  <td className="p-4 text-slate-300">{job.evidence_id}</td>
                  <td className="p-4 font-sans text-slate-200 font-medium">{job.job_type}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">
                    {job.execution_time_ms ? `${job.execution_time_ms.toFixed(1)} ms` : '—'}
                  </td>
                  <td className="p-4 text-slate-400">
                    {job.created_at || job.startedAt ? new Date(job.created_at || job.startedAt || '').toLocaleTimeString() : 'N/A'}
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                    No diagnostic analysis jobs in the queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Sign-Off Review Modal */}
      {reviewModalFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-sky-400" />
                Examiner Finding Sign-Off
              </h2>
            </div>

            <form onSubmit={handleReviewFinding} className="p-6 space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                <div className="text-white font-semibold">{reviewModalFinding.title}</div>
                <div className="text-slate-400">{reviewModalFinding.description}</div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Examiner Name / Badge ID</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Formal Review Assessment</label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewModalFinding(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                >
                  {submittingReview ? 'Submitting...' : 'Confirm Sign-Off'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
