import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  Link as LinkIcon, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  User, 
  MapPin, 
  Calendar, 
  Lock, 
  FileCheck,
  RefreshCw,
  X,
  Hash
} from 'lucide-react';
import { api } from '../services/api';
import { CustodyEvent, Evidence } from '../types';

export const CustodyPage: React.FC = () => {
  const [events, setEvents] = useState<CustodyEvent[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEvidenceForVerify, setSelectedEvidenceForVerify] = useState<string>('');

  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    evidence_id: string;
    events_count: number;
    message: string;
    broken_at_index?: number;
  } | null>(null);

  // Transfer Modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  const [targetEvidenceId, setTargetEvidenceId] = useState('');
  const [toCustodian, setToCustodian] = useState('Laboratory Custody Officer');
  const [action, setAction] = useState('TRANSFER');
  const [reason, setReason] = useState('Scheduled forensic laboratory examination');
  const [location, setLocation] = useState('Forensic Vault B - Shelf 04');
  const [authRef, setAuthRef] = useState('WARRANT-2026-SEC8');
  const [transferNotes, setTransferNotes] = useState('Transferred under secure anti-static tamper-evident seal.');

  const loadData = async () => {
    try {
      setLoading(true);
      const [evList, cEvents] = await Promise.all([
        api.getEvidenceList(),
        api.getCustodyEvents()
      ]);
      setEvidenceList(evList);
      setEvents(cEvents);
      if (evList.length > 0 && !selectedEvidenceForVerify) {
        setSelectedEvidenceForVerify(evList[0].id);
        setTargetEvidenceId(evList[0].id);
      }
    } catch (e) {
      console.error('Failed to load custody data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyChain = async () => {
    if (!selectedEvidenceForVerify) return;
    try {
      setVerifying(true);
      const res = await api.verifyCustodyChain(selectedEvidenceForVerify);
      setVerificationResult(res);
    } catch (e: any) {
      setVerificationResult({
        valid: false,
        evidence_id: selectedEvidenceForVerify,
        events_count: 0,
        message: e?.response?.data?.detail || 'Custody verification failed'
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEvidenceId) return;

    try {
      setTransferring(true);
      setTransferError(null);
      await api.transferCustody({
        evidence_id: targetEvidenceId,
        action,
        to_custodian: toCustodian,
        reason,
        location,
        authorization_ref: authRef,
        notes: transferNotes
      });
      setShowTransferModal(false);
      loadData();
    } catch (err: any) {
      setTransferError(err?.response?.data?.detail || 'Failed to record custody transfer');
    } finally {
      setTransferring(false);
    }
  };

  const filteredEvents = events.filter(ev => {
    return (
      (ev.evidence_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (ev.to_custodian || '').toLowerCase().includes(search.toLowerCase()) ||
      (ev.from_custodian && ev.from_custodian.toLowerCase().includes(search.toLowerCase())) ||
      (ev.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (ev.location && ev.location.toLowerCase().includes(search.toLowerCase())) ||
      (ev.event_hash && ev.event_hash.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            Primary Question: Who handled this evidence, and when?
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-sky-400" />
            Chain of Custody Ledger
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Chronological, tamper-evident record of acquisition, physical transfers, lab examinations, and custody actions. Each event is cryptographically hashed and linked via parent-event hashes.
          </p>
        </div>

        <button
          onClick={() => setShowTransferModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-sky-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Custody Transfer</span>
        </button>
      </div>

      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-400 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong className="text-slate-200">Custodial Integrity:</strong> Historical custody events are cryptographically linked in an append-only sequence. In accordance with forensic standards, past custody entries cannot be silently edited or deleted.
        </span>
      </div>

      {/* Verification Action Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
          <Lock className="w-4 h-4 text-sky-400" />
          Cryptographic Hash Chain Verifier
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Recalculate and verify SHA-256 parent-child hash linkages for all chronological handover events belonging to an evidence item.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select
            value={selectedEvidenceForVerify}
            onChange={(e) => setSelectedEvidenceForVerify(e.target.value)}
            className="w-full sm:w-80 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
          >
            {evidenceList.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.id} — {ev.original_filename}
              </option>
            ))}
          </select>

          <button
            onClick={handleVerifyChain}
            disabled={verifying || !selectedEvidenceForVerify}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-600/20 transition cursor-pointer"
          >
            {verifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Verifying Hash Links...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Verify Custody Chain</span>
              </>
            )}
          </button>
        </div>

        {verificationResult && (
          <div className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${
            verificationResult.valid 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            {verificationResult.valid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <div className="font-semibold text-sm">
                {verificationResult.valid ? 'Chain Cryptographically Valid' : 'Custody Chain Compromised'}
              </div>
              <p className="opacity-90">{verificationResult.message}</p>
              <div className="font-mono text-[11px] text-slate-400 pt-1">
                Evidence: {verificationResult.evidence_id} • Verified Events: {verificationResult.events_count}
                {verificationResult.broken_at_index !== undefined && (
                  <span className="text-rose-400 ml-2 font-bold">
                    [Chain broken at Event Index: {verificationResult.broken_at_index}]
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custody Ledger Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Evidence ID, Custodian, Action, Location, or SHA-256 Hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Custody Ledger Timeline Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6 text-xs text-slate-400">
          <span>Ledger Count: <strong className="text-white">{filteredEvents.length}</strong> custody handovers</span>
          <span className="font-mono text-sky-400">Append-Only MongoDB Collection: custodyEvents</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No custody events found matching your search.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((evt, idx) => (
              <div
                key={evt.id || idx}
                className="bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-xl p-5 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {evt.evidence_id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                      {evt.action}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{evt.timestamp ? new Date(evt.timestamp).toLocaleString() : 'N/A'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="text-slate-500 font-medium">Custody Transfer</div>
                    <div className="flex items-center gap-2 text-slate-200">
                      <span className="text-slate-400">{evt.from_custodian || 'INITIAL ACQUISITION'}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <strong className="text-white">{evt.to_custodian}</strong>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-slate-500 font-medium">Storage Location & Auth</div>
                    <div className="text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{evt.location || 'Secure Forensic Repository'}</span>
                    </div>
                    {evt.authorization_ref && (
                      <div className="text-slate-500 font-mono text-[11px]">Auth: {evt.authorization_ref}</div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="text-slate-500 font-medium">Reason / Scope</div>
                    <div className="text-slate-300">{evt.reason || 'Forensic custody preservation'}</div>
                  </div>
                </div>

                {/* Hashes section: SHA-256 event hash and previous event hash */}
                <div className="pt-3 border-t border-slate-900 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="flex items-center gap-2 text-slate-400 bg-slate-900/60 p-2 rounded">
                    <Hash className="w-3 h-3 text-sky-400 shrink-0" />
                    <span className="text-slate-500">Event Hash:</span>
                    <span className="text-slate-300 truncate" title={evt.event_hash}>
                      {evt.event_hash ? evt.event_hash : 'UNHASHED_LEGACY'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 bg-slate-900/60 p-2 rounded">
                    <LinkIcon className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="text-slate-500">Parent Link:</span>
                    <span className="text-slate-300 truncate" title={evt.prev_event_hash || 'GENESIS'}>
                      {evt.prev_event_hash ? evt.prev_event_hash : '00000000000000000000000000000000 (GENESIS)'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transfer Custody Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-sky-400" />
                Record Chain of Custody Handover
              </h2>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              {transferError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{transferError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Evidence Artifact</label>
                <select
                  value={targetEvidenceId}
                  onChange={(e) => setTargetEvidenceId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                >
                  {evidenceList.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.id} — {ev.original_filename}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Handover Action</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="TRANSFER">TRANSFER (Standard Handover)</option>
                    <option value="ANALYSIS_CHECKOUT">ANALYSIS_CHECKOUT (Lab Analysis)</option>
                    <option value="COURT_PRODUCTION">COURT_PRODUCTION (Legal Proceeding)</option>
                    <option value="STORAGE_RETURN">STORAGE_RETURN (Vault Secured)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Receiving Custodian</label>
                  <input
                    type="text"
                    value={toCustodian}
                    onChange={(e) => setToCustodian(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Storage Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Authorization Ref</label>
                  <input
                    type="text"
                    value={authRef}
                    onChange={(e) => setAuthRef(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reason for Transfer</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Custody Ledger Notes</label>
                <textarea
                  rows={2}
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferring}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-sky-600/20 transition cursor-pointer"
                >
                  {transferring ? 'Hashing & Appending...' : 'Append Custody Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
