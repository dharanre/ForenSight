import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  CheckCircle, 
  AlertTriangle, 
  FileUp, 
  Layers, 
  Eye, 
  Activity,
  ArrowRight,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { Evidence, VerificationRecord } from '../types';

export const VerifyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectId = searchParams.get('ref');

  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>(preselectId || '');
  const [verifier, setVerifier] = useState('Senior Forensic Examiner');
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationRecord | null>(null);

  useEffect(() => {
    api.getEvidenceList().then((data) => {
      setEvidenceList(data);
      if (!selectedEvidenceId && data.length > 0) {
        setSelectedEvidenceId(data[0].id);
      }
    });
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvidenceId) {
      setError('Please choose reference evidence.');
      return;
    }
    if (!file) {
      setError('Please select a candidate file to compare.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append('verifier', verifier);
      formData.append('file', file);

      const vrf = await api.verifyEvidence(selectedEvidenceId, formData);
      setResult(vrf);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Verification comparison failed.');
    } finally {
      setLoading(false);
    }
  };

  const selectedEvidence = evidenceList.find((e) => e.id === selectedEvidenceId);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
          Primary Question: Does this file still match its recorded baseline hash?
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-sky-400" />
          Evidence Integrity & Tamper Verification
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Upload any candidate copy or re-acquired artifact to compare against its immutable baseline SHA-256 hash. If tampered, Merkle block proofs and ELA heatmaps pinpoint the exact byte modifications.
        </p>

        <div className="mt-4 p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-400 flex items-start gap-2.5">
          <Eye className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong className="text-slate-200">Forensic Principle:</strong> A successful cryptographic hash comparison confirms bitstream content equality against the stored baseline; it does not independently prove the authenticity or legal admissibility of the original acquisition.
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3 text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Verification Form */}
      <form onSubmit={handleVerify} className="p-8 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Select Reference Evidence</label>
            <select
              value={selectedEvidenceId}
              onChange={(e) => setSelectedEvidenceId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            >
              {evidenceList.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.original_filename} ({ev.id})
                </option>
              ))}
            </select>
            {selectedEvidence && (
              <p className="text-[11px] font-mono text-slate-500 mt-1.5 truncate">
                Ref Hash: {selectedEvidence.sha256}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Verifier Name</label>
            <input
              type="text"
              value={verifier}
              onChange={(e) => setVerifier(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Candidate File Upload */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Upload Candidate Copy to Verify</label>
          <div className="border-2 border-dashed border-slate-800 hover:border-sky-500/50 bg-slate-950/60 rounded-xl p-8 text-center transition">
            <input
              type="file"
              id="candidate-upload"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
              className="hidden"
            />
            <label htmlFor="candidate-upload" className="cursor-pointer flex flex-col items-center">
              <FileUp className="w-10 h-10 text-sky-400 mb-3" />
              <p className="text-sm font-medium text-slate-200">
                {file ? file.name : 'Select candidate copy to compare against reference'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Preserved separately without modifying original evidence</p>
              {file && (
                <span className="mt-3 text-xs font-mono px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
                  Candidate Size: {(file.size / 1024).toFixed(1)} KB
                </span>
              )}
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-lg shadow-sky-600/20 transition flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Executing Block Comparison & Tamper Localization...</span>
            </>
          ) : (
            <>
              <Activity className="w-4 h-4" />
              <span>Verify Integrity & Localize Tampering</span>
            </>
          )}
        </button>
      </form>

      {/* Results View */}
      {result && (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              {result.exact_match ? (
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-8 h-8 text-red-400" />
              )}
              <div>
                <h3 className="text-lg font-bold text-white">
                  {result.exact_match ? 'Integrity Verified: Exact Copy' : 'Integrity Compromise: Tampering Detected'}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Verification ID: {result.id} • Compared {result.total_blocks_compared} blocks (4 KiB each)
                </p>
              </div>
            </div>

            <span className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold ${
              result.exact_match 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {result.exact_match ? '100% IDENTICAL' : `${result.differing_blocks_percentage}% DIFFERING BLOCKS`}
            </span>
          </div>

          {/* Block Comparison Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono bg-slate-950 p-5 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 block">MATCHING BLOCKS</span>
              <span className="text-emerald-400 text-sm font-bold">{result.matching_blocks_count} ({result.matching_blocks_percentage}%)</span>
            </div>
            <div>
              <span className="text-slate-500 block">DIFFERING BLOCKS</span>
              <span className="text-red-400 text-sm font-bold">{result.differing_blocks_count} ({result.differing_blocks_percentage}%)</span>
            </div>
            <div>
              <span className="text-slate-500 block">VISUAL SIMILARITY</span>
              <span className="text-sky-400 text-sm font-bold">{result.visual_similarity_percentage ?? 'N/A'}%</span>
            </div>
            <div>
              <span className="text-slate-500 block">PHASH HAMMING DIST</span>
              <span className="text-slate-200 text-sm font-bold">{result.perceptual_hash_distance ?? 'N/A'}</span>
            </div>
          </div>

          {/* Tamper Map Visualization (if image) */}
          {result.tamper_heatmap_path && (
            <div className="space-y-3">
              <h4 className="font-semibold text-white text-sm">Visual Tamper Localization Map</h4>
              <p className="text-xs text-slate-400">
                Differences highlighted via JET heatmap overlay and bounding contours around altered visual sectors:
              </p>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-center">
                <img 
                  src={`/static/findings/${result.id}_heatmap.png`} 
                  alt="Tamper Heatmap"
                  className="max-h-96 rounded-lg object-contain border border-slate-800"
                />
              </div>
            </div>
          )}

          {/* Contiguous Changed Byte Ranges */}
          {result.byte_ranges_diff && result.byte_ranges_diff.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-white text-sm">Detected Changed Byte Ranges</h4>
              <div className="max-h-48 overflow-y-auto bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-2 font-mono text-xs">
                {result.byte_ranges_diff.map((rng, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-300 border-b border-slate-800/60 pb-1">
                    <span>Range #{idx + 1}: Offset {rng.start} → {rng.end}</span>
                    <span className="text-red-400">{rng.length} bytes changed</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
