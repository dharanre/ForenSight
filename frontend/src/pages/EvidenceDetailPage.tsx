import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  Download, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Clock, 
  Database,
  Search,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { Evidence, ForensicFinding } from '../types';

export const EvidenceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CHECKS' | 'CUSTODY' | 'VERIFICATIONS'>('OVERVIEW');

  const loadEvidence = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getEvidenceDetail(id);
      setEvidence(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvidence();
  }, [id]);

  const handleReviewFinding = async (findingId: string) => {
    try {
      await api.reviewFinding(findingId, 'Forensic Examiner', 'Reviewed and noted.');
      loadEvidence();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!evidence) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-bold text-white">Evidence Not Found</h3>
        <Link to="/" className="text-sm text-sky-400 mt-2 inline-block">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Evidence Banner */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-white">{evidence.original_filename}</h2>
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {evidence.id}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Case: {evidence.case_id} • Acquired: {evidence.acquired_at ? new Date(evidence.acquired_at).toUTCString() : 'N/A'} • By: {evidence.acquisition_operator || 'Examiner'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={api.getReportUrl(evidence.id)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-sky-600/20 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Report</span>
          </a>
          <Link
            to={`/verify?ref=${evidence.id}`}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Candidate Copy</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-sm font-medium">
        {[
          { key: 'OVERVIEW', label: 'Integrity & Hashes' },
          { key: 'CHECKS', label: `Forensic Findings (${evidence.findings?.length || 0})` },
          { key: 'CUSTODY', label: `Chain of Custody (${evidence.custody_events?.length || 0})` },
          { key: 'VERIFICATIONS', label: `Verifications (${evidence.verifications?.length || 0})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 transition-colors ${
              activeTab === tab.key
                ? 'text-sky-400 border-b-2 border-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fingerprints Card */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h4 className="font-semibold text-white text-sm">Cryptographic Hashes & Signatures</h4>
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block font-sans">PRIMARY SHA-256</span>
                <span className="text-slate-200 break-all">{evidence.sha256}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block font-sans">MERKLE ROOT (4 KiB Blocks)</span>
                <span className="text-sky-400 break-all">{evidence.merkle_root}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block font-sans">MD5 COMPATIBILITY</span>
                  <span className="text-slate-300 break-all">{evidence.md5}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block font-sans">SHA-1 COMPATIBILITY</span>
                  <span className="text-slate-300 break-all">{evidence.sha1}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Blockchain & Storage Anchor Status */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h4 className="font-semibold text-white text-sm">Integrity Anchor Specification</h4>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Anchoring Anchor Layer:</span>
                <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                  evidence.anchoring_status === 'ANCHORED_CHAIN' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {evidence.anchoring_status === 'ANCHORED_CHAIN' ? 'LOCAL FORENCHAIN SMART CONTRACT' : 'DATABASE BACKED FALLBACK'}
                </span>
              </div>

              {evidence.blockchain_tx_hash && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block font-mono">ETHEREUM TX HASH</span>
                  <span className="text-emerald-400 font-mono break-all">{evidence.blockchain_tx_hash}</span>
                </div>
              )}

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Watchdog Live Verification:</span>
                <span className="font-mono text-emerald-400 font-bold">{evidence.integrity_status}</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Total Analyzed Blocks:</span>
                <span className="font-mono text-slate-200">{evidence.total_blocks} blocks ({evidence.block_size_bytes} bytes/block)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: CHECKS */}
      {activeTab === 'CHECKS' && (
        <div className="space-y-4">
          {evidence.findings && evidence.findings.length > 0 ? (
            evidence.findings.map((finding) => {
              const isCrit = finding.severity === 'CRITICAL' || finding.severity === 'HIGH';
              const isMed = finding.severity === 'MEDIUM';
              return (
                <div
                  key={finding.id}
                  className={`p-5 rounded-xl border ${
                    isCrit 
                      ? 'bg-red-500/5 border-red-500/20' 
                      : isMed 
                      ? 'bg-amber-500/5 border-amber-500/20' 
                      : 'bg-slate-900 border-slate-800'
                  } space-y-3`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isCrit ? 'bg-red-500/20 text-red-400' : isMed ? 'bg-amber-500/20 text-amber-400' : 'bg-sky-500/20 text-sky-400'
                        }`}>
                          {finding.severity}
                        </span>
                        <span className="text-xs font-mono text-slate-400">{finding.check_category}</span>
                        {finding.is_reviewed && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
                            <Check className="w-3 h-3" /> REVIEWED
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-base">{finding.title}</h4>
                    </div>

                    {!finding.is_reviewed && (
                      <button
                        onClick={() => handleReviewFinding(finding.id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition"
                      >
                        Mark as Reviewed
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-slate-300">{finding.description}</p>

                  {finding.supporting_observations && (
                    <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 text-xs font-mono text-slate-400 overflow-x-auto">
                      <pre>{JSON.stringify(finding.supporting_observations, null, 2)}</pre>
                    </div>
                  )}

                  {finding.recommendation && (
                    <p className="text-xs text-sky-400/90 font-medium">
                      💡 Recommendation: {finding.recommendation}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-500 py-8 text-center">No forensic findings recorded.</p>
          )}
        </div>
      )}

      {/* Tab: CUSTODY */}
      {activeTab === 'CUSTODY' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <h4 className="font-semibold text-white text-sm">Append-Only Chain-of-Custody Timeline</h4>
          <div className="relative border-l border-slate-800 ml-4 space-y-6 py-2">
            {evidence.custody_events?.map((evt) => (
              <div key={evt.id} className="relative pl-6">
                <div className="absolute -left-2 top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-sky-400" />
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-400">{evt.event_type || evt.action || 'EVENT'}</span>
                    <span className="text-slate-500 text-[10px]">{evt.timestamp ? new Date(evt.timestamp).toUTCString() : 'N/A'}</span>
                  </div>
                  <p className="text-slate-300 font-sans">{evt.notes || 'Custody action recorded'}</p>
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Actor: {evt.actor || evt.to_custodian || 'Examiner'}</span>
                    <span>Event Hash: {(evt.event_record_hash || evt.event_hash || 'PENDING').slice(0, 16)}...</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: VERIFICATIONS */}
      {activeTab === 'VERIFICATIONS' && (
        <div className="space-y-4">
          {evidence.verifications && evidence.verifications.length > 0 ? (
            evidence.verifications.map((v) => (
              <div key={v.id} className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-base">{v.candidate_filename}</h4>
                    <p className="text-xs text-slate-400 font-mono">
                      Verified at: {v.verified_at ? new Date(v.verified_at).toLocaleString() : 'N/A'} by {v.verifier}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                    v.exact_match
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {v.exact_match ? 'EXACT COPY' : 'TAMPERING DETECTED'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-500 block">MATCHING BLOCKS</span>
                    <span className="text-slate-200">{v.matching_blocks_count} ({v.matching_blocks_percentage}%)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">DIFFERING BLOCKS</span>
                    <span className="text-red-400 font-bold">{v.differing_blocks_count} ({v.differing_blocks_percentage}%)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">VISUAL SIMILARITY</span>
                    <span className="text-sky-400">{v.visual_similarity_percentage ?? 'N/A'}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">PERCEPTUAL DISTANCE</span>
                    <span className="text-slate-200">{v.perceptual_hash_distance ?? 'N/A'}</span>
                  </div>
                </div>

                {v.tamper_heatmap_path && (
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Visual Tamper Localization Map</h5>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 inline-block">
                      <img 
                        src={`/static/findings/${v.id}_heatmap.png`} 
                        alt="Tamper Heatmap"
                        className="max-h-64 rounded object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 py-8 text-center">No candidate copies verified against this evidence yet.</p>
          )}
        </div>
      )}
    </div>
  );
};
