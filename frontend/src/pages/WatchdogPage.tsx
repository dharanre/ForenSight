import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Play, CheckCircle2, AlertOctagon, Clock } from 'lucide-react';
import { api } from '../services/api';
import { WatchdogAudit } from '../types';

export const WatchdogPage: React.FC = () => {
  const [audits, setAudits] = useState<WatchdogAudit[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggerStatus, setTriggerStatus] = useState<string | null>(null);

  const loadAudits = async () => {
    try {
      const data = await api.getWatchdogAudits();
      setAudits(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAudits();
  }, []);

  const handleTrigger = async () => {
    try {
      setLoading(true);
      setTriggerStatus('Rehashing all evidence files in storage...');
      const res = await api.triggerWatchdog();
      setTriggerStatus(`Audit complete: Status ${res.last_audit_status}`);
      loadAudits();
    } catch (e: any) {
      setTriggerStatus('Failed to run watchdog audit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Scheduled Integrity Watchdog</h2>
          <p className="text-sm text-slate-400 mt-1">
            Automated background daemon periodically re-hashes stored evidence to detect silent corruption, deletion, or untracked tampering.
          </p>
        </div>
        <button
          onClick={handleTrigger}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-lg shadow-sky-600/20 transition"
        >
          <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Auditing Now...' : 'Trigger Immediate Audit'}</span>
        </button>
      </div>

      {triggerStatus && (
        <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400 text-xs font-mono">
          {triggerStatus}
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden space-y-4 p-6">
        <h4 className="font-semibold text-white text-sm">Watchdog Execution Audit Trail</h4>
        <div className="divide-y divide-slate-800/60 font-mono text-xs">
          {audits.map((a) => (
            <div key={a.id} className="py-3.5 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <span className="text-sky-400 font-bold">{a.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    a.status === 'PASSED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {a.status}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] font-sans">
                  Checked {a.total_checked} files • {a.total_passed} Verified • {a.total_mismatches} Mismatches • {a.total_missing} Missing
                </p>
              </div>
              <span className="text-[10px] text-slate-500">
                {a.run_timestamp ? new Date(a.run_timestamp).toLocaleString() : 'N/A'}
              </span>
            </div>
          ))}
          {audits.length === 0 && (
            <p className="text-center py-8 text-slate-500 font-sans text-xs">No audits recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
