import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileUp, CheckCircle, AlertCircle, Shield, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { Evidence } from '../types';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [caseId, setCaseId] = useState('CASE-2026-001');
  const [operator, setOperator] = useState('Senior Forensic Examiner');
  const [notes, setNotes] = useState('Seized digital evidence from workstation storage.');
  const [sourceDevice, setSourceDevice] = useState('Digital Storage Unit A');
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Evidence | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an evidence file to upload.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setCurrentStage('Streaming file & computing cryptographic fingerprints...');

      const formData = new FormData();
      formData.append('case_id', caseId);
      formData.append('acquisition_operator', operator);
      formData.append('acquisition_notes', notes);
      formData.append('source_device', sourceDevice);
      formData.append('file', file);

      setTimeout(() => setCurrentStage('Dividing byte blocks & generating Merkle tree...'), 400);
      setTimeout(() => setCurrentStage('Executing 5-Part forensic engine checks...'), 800);
      setTimeout(() => setCurrentStage('Anchoring hashes to ForenChain smart contract...'), 1200);

      const registered = await api.registerEvidence(formData);
      setResult(registered);
      setCurrentStage('Completed');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Acquisition pipeline error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Digital Evidence Acquisition</h2>
        <p className="text-sm text-slate-400 mt-1">
          Preserve digital files non-destructively, compute SHA-256 fingerprints, construct Merkle tree manifests, and anchor on ForenChain.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!result ? (
        <form onSubmit={handleSubmit} className="p-8 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Case Identifier</label>
              <input 
                type="text" 
                value={caseId} 
                onChange={(e) => setCaseId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Acquisition Operator</label>
              <input 
                type="text" 
                value={operator} 
                onChange={(e) => setOperator(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Source Device / Origin</label>
              <input 
                type="text" 
                value={sourceDevice} 
                onChange={(e) => setSourceDevice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Acquisition Notes</label>
              <input 
                type="text" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* File Upload Zone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Select Digital Evidence File</label>
            <div className="border-2 border-dashed border-slate-800 hover:border-sky-500/50 bg-slate-950/60 rounded-xl p-8 text-center transition">
              <input 
                type="file" 
                id="file-upload" 
                onChange={handleFileChange} 
                className="hidden" 
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <FileUp className="w-10 h-10 text-sky-400 mb-3" />
                <p className="text-sm font-medium text-slate-200">
                  {file ? file.name : 'Click to select or drag and drop evidence'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supported formats: JPEG, PNG, PDF, DOCX, ZIP, Binary (Max 50MB)
                </p>
                {file && (
                  <span className="mt-3 text-xs font-mono px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
                    Size: {(file.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-lg shadow-sky-600/20 transition flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{currentStage || 'Processing...'}</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Acquire & Execute Forensic Analysis</span>
              </>
            )}
          </button>
        </form>
      ) : (
        /* Result Preview Card */
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex items-center space-x-3 text-emerald-400">
            <CheckCircle className="w-7 h-7" />
            <div>
              <h3 className="text-lg font-bold text-white">Evidence Acquired and Anchored Successfully</h3>
              <p className="text-xs text-slate-400">Fingerprints and Merkle manifest registered to ForenScan ledger.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono bg-slate-950 p-5 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 block">EVIDENCE ID</span>
              <span className="text-sky-400 font-bold">{result.id}</span>
            </div>
            <div>
              <span className="text-slate-500 block">ANCHORING STATUS</span>
              <span className="text-emerald-400 font-bold">{result.anchoring_status}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">PRIMARY SHA-256 HASH</span>
              <span className="text-slate-200 break-all">{result.sha256}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">MERKLE ROOT</span>
              <span className="text-slate-200 break-all">{result.merkle_root}</span>
            </div>
            <div>
              <span className="text-slate-500 block">TOTAL BLOCKS (4 KiB)</span>
              <span className="text-slate-300">{result.total_blocks}</span>
            </div>
            <div>
              <span className="text-slate-500 block">DETECTED MIME</span>
              <span className="text-slate-300">{result.detected_mime_type}</span>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => navigate(`/evidence/${result.id}`)}
              className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm rounded-lg flex items-center justify-center space-x-2 transition"
            >
              <span>Inspect Detailed Forensic Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setResult(null); setFile(null); }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm rounded-lg transition"
            >
              Acquire Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
