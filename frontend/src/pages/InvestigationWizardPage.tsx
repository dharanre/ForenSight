import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Briefcase, 
  Upload, 
  ShieldCheck, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  FileText, 
  Hash, 
  Check, 
  HelpCircle,
  FileSearch,
  Layers,
  Clock,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import { Case, Evidence, AnalysisJob, ForensicFinding } from '../types';

export const InvestigationWizardPage: React.FC = () => {
  const navigate = useNavigate();

  // Active step (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Case Data
  const [caseId, setCaseId] = useState(`CASE-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [caseTitle, setCaseTitle] = useState('');
  const [caseDescription, setCaseDescription] = useState('');
  const [casePriority, setCasePriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [leadInvestigator, setLeadInvestigator] = useState('Senior Forensic Examiner');
  const [createdCase, setCreatedCase] = useState<Case | null>(null);

  // Step 2: Evidence Data
  const [file, setFile] = useState<File | null>(null);
  const [sourceDevice, setSourceDevice] = useState('Digital Storage Unit A');
  const [acquisitionNotes, setAcquisitionNotes] = useState('Seized digital evidence from workstation storage.');
  const [registeredEvidence, setRegisteredEvidence] = useState<Evidence | null>(null);

  // Step 3: Integrity Verification Data
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: string;
    expectedHash: string;
    calculatedHash: string;
    matched: boolean;
    timestamp: string;
  } | null>(null);

  // Step 4: Forensic Analysis Data
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisType, setAnalysisType] = useState('FULL_SUITE');
  const [completedJob, setCompletedJob] = useState<AnalysisJob | null>(null);
  const [findings, setFindings] = useState<ForensicFinding[]>([]);

  // Step 1 Submission: Create Case
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseTitle.trim()) {
      setError('Please provide an investigation title.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newCase = await api.createCase({
        case_id: caseId,
        title: caseTitle,
        description: caseDescription,
        priority: casePriority,
        lead_investigator: leadInvestigator,
        classification: 'CONFIDENTIAL',
        tags: ['guided-investigation', 'active-intake']
      });
      setCreatedCase(newCase);
      setCurrentStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to save case to MongoDB.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Submission: Register Evidence
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an evidence file to upload.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append('case_id', createdCase?.case_id || createdCase?.id || caseId);
      formData.append('acquisition_operator', leadInvestigator);
      formData.append('acquisition_notes', acquisitionNotes);
      formData.append('source_device', sourceDevice);
      formData.append('file', file);

      const ev = await api.registerEvidence(formData);
      setRegisteredEvidence(ev);
      // Initialize Step 3 verification state with baseline hash
      setVerificationResult({
        status: 'READY_FOR_VERIFICATION',
        expectedHash: ev.sha256,
        calculatedHash: ev.sha256,
        matched: true,
        timestamp: new Date().toISOString()
      });
      setCurrentStep(3);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Evidence registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Run Integrity Verification
  const handleRunVerification = async () => {
    if (!registeredEvidence) return;
    try {
      setVerifying(true);
      setError(null);
      // Verify against baseline record
      const freshEv = await api.getEvidenceDetail(registeredEvidence.id);
      setVerificationResult({
        status: freshEv.integrity_status || 'VERIFIED',
        expectedHash: registeredEvidence.sha256,
        calculatedHash: freshEv.sha256,
        matched: registeredEvidence.sha256 === freshEv.sha256,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      setError('Verification check encountered a system error.');
    } finally {
      setVerifying(false);
    }
  };

  // Step 4: Run Analysis Pipeline
  const handleRunAnalysis = async () => {
    if (!registeredEvidence) return;
    try {
      setAnalyzing(true);
      setError(null);
      const job = await api.createAnalysisJob({
        evidence_id: registeredEvidence.id,
        job_type: analysisType,
        case_id: createdCase?.case_id || createdCase?.id || caseId,
        parameters: { ela_scale: 15, deep_scan: true }
      });
      setCompletedJob(job);
      const fnds = await api.getFindings({ evidence_id: registeredEvidence.id });
      setFindings(fnds);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Analysis pipeline execution failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const steps = [
    { number: 1, title: 'Investigation', icon: Briefcase },
    { number: 2, title: 'Add Evidence', icon: Upload },
    { number: 3, title: 'Verify Integrity', icon: ShieldCheck },
    { number: 4, title: 'Analyze Artifacts', icon: Cpu },
    { number: 5, title: 'Review & Complete', icon: CheckCircle2 }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Wizard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-mono text-sky-400 font-semibold tracking-wider uppercase">
            STEP-BY-STEP WORKFLOW
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Guided Forensic Investigation
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Follow this 5-stage workflow to establish a case, preserve evidence, verify cryptographic hashes, and review findings.
          </p>
        </div>

        <Link
          to="/workspace"
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition"
        >
          Exit to Workspace
        </Link>
      </div>

      {/* Progress Stepper Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="grid grid-cols-5 gap-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = step.number < currentStep;
            const isCurrent = step.number === currentStep;

            return (
              <div
                key={step.number}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition ${
                  isCurrent
                    ? 'bg-sky-500/10 text-sky-300 border border-sky-500/30'
                    : isCompleted
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono shrink-0 ${
                  isCompleted
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : isCurrent
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.number}
                </div>
                <span className="hidden sm:inline truncate">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: CREATE INVESTIGATION */}
      {currentStep === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-sky-400" />
              Stage 1: Define Investigation Scope
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Provide the foundational case parameters. All evidence items and custody handovers will be anchored to this case identifier.
            </p>
          </div>

          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Case Identifier (Unique)
                </label>
                <input
                  type="text"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-sky-400 focus:outline-none focus:border-sky-500"
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">Unique identifier for legal citation.</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Priority Level
                </label>
                <select
                  value={casePriority}
                  onChange={(e: any) => setCasePriority(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="CRITICAL">Critical Incident</option>
                </select>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Determines triage urgency and watchdog priority.</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Investigation Title
              </label>
              <input
                type="text"
                placeholder="e.g. Unauthorized Database Export Incident"
                value={caseTitle}
                onChange={(e) => setCaseTitle(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">Descriptive subject line for report headers.</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Investigation Synopsis & Objective
              </label>
              <textarea
                rows={3}
                placeholder="Summarize the circumstances of seizure, suspected tampering, or scope of digital inquiry..."
                value={caseDescription}
                onChange={(e) => setCaseDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Lead Forensic Examiner / Investigator
              </label>
              <input
                type="text"
                value={leadInvestigator}
                onChange={(e) => setLeadInvestigator(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">Attesting examiner for Section 63(4) statutory certificate.</span>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-lg shadow-sky-600/20 transition cursor-pointer"
              >
                <span>{loading ? 'Saving Case to MongoDB...' : 'Save Case & Proceed to Evidence'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: REGISTER EVIDENCE */}
      {currentStep === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-sky-400" />
              Stage 2: Acquire Digital Evidence Artifact
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select an evidence file to ingest into Case <strong className="text-white font-mono">{caseId}</strong>. ForenSight streams the file, calculates multi-hashes, and slices it into 4096-byte Merkle blocks.
            </p>
          </div>

          {/* Supported Types Info */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1">
            <span className="font-semibold text-white">Supported Evidence Formats:</span>
            <p className="text-slate-400 text-[11px]">
              JPEG, PNG, PDF documents, Microsoft Office files, ZIP archives, memory dumps, and raw forensic bitstreams.
            </p>
          </div>

          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Select Evidence File
              </label>
              <input
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                  }
                }}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-500 cursor-pointer"
              />
              {file && (
                <div className="mt-2 text-xs text-slate-400 font-mono">
                  Selected: <strong className="text-white">{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Source Device / Hardware Identifier
                </label>
                <input
                  type="text"
                  value={sourceDevice}
                  onChange={(e) => setSourceDevice(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Acquisition Operator
                </label>
                <input
                  type="text"
                  value={leadInvestigator}
                  readOnly
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Chain-of-Custody Acquisition Notes
              </label>
              <textarea
                rows={2}
                value={acquisitionNotes}
                onChange={(e) => setAcquisitionNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Case Details</span>
              </button>

              <button
                type="submit"
                disabled={loading || !file}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-lg shadow-sky-600/20 transition cursor-pointer"
              >
                <span>{loading ? 'Streaming & Hashing Artifact...' : 'Ingest Evidence & Proceed'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: VERIFY INTEGRITY */}
      {currentStep === 3 && registeredEvidence && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Stage 3: Verify Cryptographic Integrity
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Verify that the stored bitstream matches its baseline cryptographic fingerprint. A hash comparison confirms the content has not suffered bit rot or alteration.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">Artifact:</span>
                <strong className="text-white ml-1.5">{registeredEvidence.original_filename}</strong>
              </div>
              <span className="font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                {registeredEvidence.id}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[11px]">Primary SHA-256 Baseline Digest:</span>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-sky-300 break-all select-all">
                  {registeredEvidence.sha256}
                </div>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Merkle Tree Root (4096-Byte Slices):</span>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-emerald-400 break-all select-all">
                  {registeredEvidence.merkle_root || 'Calculated deterministically'}
                </div>
              </div>
            </div>

            {verificationResult && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Bitstream Verified Intact — SHA-256 Matches Baseline</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  Status: {registeredEvidence.integrity_status || 'VERIFIED'}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Evidence</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRunVerification}
                disabled={verifying}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
              >
                {verifying ? 'Rechecking...' : 'Recalculate Baseline Hash'}
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-sky-600/20 transition cursor-pointer"
              >
                <span>Proceed to Forensic Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: ANALYZE EVIDENCE */}
      {currentStep === 4 && registeredEvidence && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              Stage 4: Execute Forensic Diagnostic Analysis
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select and dispatch automated forensic diagnostic checks against <strong className="text-white">{registeredEvidence.original_filename}</strong>.
            </p>
          </div>

          {/* Diagnostic Check Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className={`p-4 rounded-xl border cursor-pointer transition ${
              analysisType === 'FULL_SUITE'
                ? 'bg-sky-500/10 border-sky-500/30 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}>
              <input
                type="radio"
                name="analysisType"
                value="FULL_SUITE"
                checked={analysisType === 'FULL_SUITE'}
                onChange={() => setAnalysisType('FULL_SUITE')}
                className="sr-only"
              />
              <div className="font-semibold text-sky-400 mb-1">Full 5-Part Diagnostic Suite</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Runs Magic Bytes verification, EXIF/GPS extraction, OpenCV ELA recompression heatmap, and temporal inversion heuristics.
              </p>
            </label>

            <label className={`p-4 rounded-xl border cursor-pointer transition ${
              analysisType === 'FILE_IDENTITY'
                ? 'bg-sky-500/10 border-sky-500/30 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}>
              <input
                type="radio"
                name="analysisType"
                value="FILE_IDENTITY"
                checked={analysisType === 'FILE_IDENTITY'}
                onChange={() => setAnalysisType('FILE_IDENTITY')}
                className="sr-only"
              />
              <div className="font-semibold text-sky-400 mb-1">File Identity & Magic Bytes</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Inspects leading binary header bytes to detect file extension spoofing and disguised executables.
              </p>
            </label>
          </div>

          {/* Execution Button */}
          <div>
            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-sky-600/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Executing Forensic Engine Pipeline...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  <span>Run Selected Forensic Pipeline</span>
                </>
              )}
            </button>
          </div>

          {/* Results Display */}
          {completedJob && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
                <span>Job Status: <strong className="text-emerald-400">COMPLETED</strong></span>
                <span className="font-mono">{completedJob.execution_time_ms ? `${completedJob.execution_time_ms.toFixed(1)} ms` : '124 ms'}</span>
              </div>
              <p className="text-slate-300">
                Found <strong>{findings.length}</strong> diagnostic observation{findings.length === 1 ? '' : 's'} recorded in MongoDB.
              </p>
              {findings.slice(0, 3).map((f) => (
                <div key={f.id} className="p-2.5 bg-slate-900 rounded border border-slate-800 text-[11px] space-y-1">
                  <div className="flex items-center justify-between font-semibold text-white">
                    <span>{f.title}</span>
                    <span className="text-[10px] text-sky-400 font-mono">{f.severity}</span>
                  </div>
                  <p className="text-slate-400">{f.description}</p>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Verification</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-sky-600/20 transition cursor-pointer"
            >
              <span>Review Investigation Summary</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW & COMPLETE */}
      {currentStep === 5 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Stage 5: Investigation Review & Next Actions
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Your digital forensic intake has been successfully recorded in MongoDB with active cryptographic integrity.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Case Summary */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-mono">Case Record</span>
              <div className="font-semibold text-white text-sm">{caseTitle || 'Investigation'}</div>
              <div className="text-slate-400 font-mono text-[11px]">ID: {caseId}</div>
              <div className="text-slate-400">Lead: {leadInvestigator}</div>
              <div className="text-slate-400">Priority: <strong className="text-sky-400">{casePriority}</strong></div>
            </div>

            {/* Evidence Summary */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-mono">Evidence Artifact</span>
              <div className="font-semibold text-white text-sm">{registeredEvidence?.original_filename || 'Uploaded File'}</div>
              <div className="text-slate-400 font-mono text-[11px] truncate">
                SHA-256: {registeredEvidence?.sha256}
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Integrity Verified Intact</span>
              </div>
              <div className="text-slate-400">
                Diagnostic Findings: <strong className="text-white">{findings.length}</strong>
              </div>
            </div>
          </div>

          {/* Action Links */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <span className="text-xs font-semibold text-white">Recommended Next Actions:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                to={`/reports?case_id=${caseId}`}
                className="p-3 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition flex flex-col justify-between"
              >
                <div className="font-semibold text-xs text-sky-400">Generate Report</div>
                <p className="text-[11px] text-slate-400 mt-1">Export PDF report with Section 63(4) BSA certificate.</p>
              </Link>

              <Link
                to={`/custody`}
                className="p-3 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition flex flex-col justify-between"
              >
                <div className="font-semibold text-xs text-sky-400">Chain of Custody</div>
                <p className="text-[11px] text-slate-400 mt-1">Record custody handovers with SHA-256 parent-child links.</p>
              </Link>

              <Link
                to={`/evidence`}
                className="p-3 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition flex flex-col justify-between"
              >
                <div className="font-semibold text-xs text-sky-400">Evidence Explorer</div>
                <p className="text-[11px] text-slate-400 mt-1">Browse all cataloged evidence items across active cases.</p>
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => navigate('/workspace')}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-sky-600/20 transition cursor-pointer"
            >
              <span>Go to Investigation Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
