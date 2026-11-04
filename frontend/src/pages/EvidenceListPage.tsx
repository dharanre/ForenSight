import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Layers, 
  Search, 
  Eye, 
  ArrowRight, 
  Filter, 
  Plus, 
  FileUp, 
  ShieldCheck, 
  ShieldAlert, 
  Clock,
  HardDrive,
  Hash,
  Download,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { Evidence } from '../types';

export const EvidenceListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const caseIdParam = searchParams.get('case_id');

  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [anchorFilter, setAnchorFilter] = useState<string>('ALL');
  const [caseFilter, setCaseFilter] = useState<string>(caseIdParam || 'ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvidence();
  }, [caseFilter]);

  const loadEvidence = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (caseFilter && caseFilter !== 'ALL') {
        params.case_id = caseFilter;
      }
      const data = await api.getEvidenceList(params);
      setEvidenceList(data);
    } catch (e) {
      console.error('Failed to load evidence items:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = evidenceList.filter((ev) => {
    const matchesSearch =
      (ev.original_filename || ev.originalFilename || '').toLowerCase().includes(search.toLowerCase()) ||
      (ev.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (ev.case_id || ev.caseId || '').toLowerCase().includes(search.toLowerCase()) ||
      (ev.sha256 && ev.sha256.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || ev.integrity_status === statusFilter;
    const matchesAnchor = anchorFilter === 'ALL' || ev.anchoring_status === anchorFilter;

    return matchesSearch && matchesStatus && matchesAnchor;
  });

  const uniqueCases = Array.from(new Set(evidenceList.map(e => e.case_id))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            Primary Question: What evidence do I have, and can its integrity be verified?
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-sky-400" />
            Digital Evidence Repository
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Inspect all registered digital evidence items, stored baseline SHA-256 fingerprints, acquisition timestamps, and current integrity status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/verify"
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verify Integrity</span>
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-sky-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Evidence</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by filename, Evidence ID, Case ID, or SHA-256 hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={caseFilter}
            onChange={(e) => setCaseFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Cases</option>
            {uniqueCases.map(cId => (
              <option key={cId} value={cId}>{cId}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Integrity</option>
            <option value="VERIFIED">Verified Intact</option>
            <option value="COMPROMISED">Compromised</option>
            <option value="TAMPERED">Tampered</option>
          </select>

          <select
            value={anchorFilter}
            onChange={(e) => setAnchorFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Anchors</option>
            <option value="ANCHORED_CHAIN">Anchored Chain</option>
            <option value="DB_FALLBACK">DB Fallback</option>
          </select>
        </div>
      </div>

      {/* Evidence Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing <strong className="text-white">{filtered.length}</strong> evidence item{filtered.length === 1 ? '' : 's'}</span>
          <span className="font-mono">Merkle Slicing: 4096B blocks</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <HardDrive className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No Evidence Found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              No evidence artifacts match the selected criteria. Use the Intake Evidence button to acquire new items.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Evidence ID</th>
                  <th className="p-4 font-sans">Filename / Case</th>
                  <th className="p-4">Primary SHA-256</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Merkle Root</th>
                  <th className="p-4">Anchor</th>
                  <th className="p-4">Watchdog</th>
                  <th className="p-4 text-right font-sans">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <Link 
                        to={`/evidence/${ev.id}`}
                        className="text-sky-400 hover:text-sky-300 font-bold hover:underline"
                      >
                        {ev.id}
                      </Link>
                    </td>

                    <td className="p-4 font-sans">
                      <div className="font-medium text-slate-200">{ev.original_filename}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-sky-500">{ev.case_id || ev.caseId}</span>
                        <span>•</span>
                        <span>{ev.acquired_at || ev.acquisitionTimestamp ? new Date(ev.acquired_at || ev.acquisitionTimestamp || '').toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </td>

                    <td className="p-4 text-slate-400">
                      <div className="flex items-center gap-1.5" title={ev.sha256}>
                        <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{ev.sha256.slice(0, 14)}...</span>
                      </div>
                    </td>

                    <td className="p-4 text-slate-300">
                      {(((ev.file_size_bytes || ev.fileSize) || 0) / 1024).toFixed(1)} KB
                    </td>

                    <td className="p-4 text-slate-400">
                      {ev.merkle_root ? (
                        <span title={ev.merkle_root}>{ev.merkle_root.slice(0, 10)}...</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ev.anchoring_status === 'ANCHORED_CHAIN'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {ev.anchoring_status === 'ANCHORED_CHAIN' ? 'CHAIN' : 'DB FALLBACK'}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        ev.integrity_status === 'VERIFIED'
                          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                          : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                      }`}>
                        {ev.integrity_status === 'VERIFIED' ? (
                          <ShieldCheck className="w-3 h-3" />
                        ) : (
                          <ShieldAlert className="w-3 h-3" />
                        )}
                        <span>{ev.integrity_status}</span>
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 font-sans">
                        <Link
                          to={`/verify?ref=${ev.id}`}
                          className="px-2 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition"
                          title="Verify Candidate File"
                        >
                          Verify
                        </Link>
                        <Link
                          to={`/evidence/${ev.id}`}
                          className="p-1.5 text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 rounded transition"
                          title="View Evidence Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
