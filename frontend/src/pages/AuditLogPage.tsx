import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  RefreshCw, 
  FileText,
  Activity,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resourceFilter, setResourceFilter] = useState('ALL');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs({
        resource_type: resourceFilter !== 'ALL' ? resourceFilter : undefined,
        search: search.trim() || undefined
      });
      setLogs(data);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [resourceFilter]);

  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (log.action || '').toLowerCase().includes(q) ||
      (log.resourceId || '').toLowerCase().includes(q) ||
      (log.actor || log.actorName || '').toLowerCase().includes(q) ||
      (log.resourceType || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-sky-400" />
            Platform Operational Audit Log
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable system audit trail tracking all access, acquisition, analysis, and report generation events.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by action, resource ID, or actor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-500 font-mono"
          >
            <option value="ALL">All Resource Types</option>
            <option value="case">Cases</option>
            <option value="evidence">Evidence</option>
            <option value="custody">Custody</option>
            <option value="analysis">Analysis</option>
            <option value="report">Reports</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Logged Events: <strong className="text-white">{filteredLogs.length}</strong></span>
          <span className="font-mono text-emerald-400">MongoDB Collection: auditLogs</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No audit log entries matching your criteria.
          </div>
        ) : (
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/40 border-b border-slate-800 text-slate-400 font-semibold uppercase">
              <tr>
                <th className="p-4">Action</th>
                <th className="p-4">Resource Type</th>
                <th className="p-4">Resource Identifier</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((log, i) => (
                <tr key={log.id || log._id || i} className="hover:bg-slate-800/30">
                  <td className="p-4 font-bold text-sky-400">{log.action}</td>
                  <td className="p-4 text-slate-400">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      {log.resourceType}
                    </span>
                  </td>
                  <td className="p-4 text-white font-medium">{log.resourceId}</td>
                  <td className="p-4 text-slate-300 font-sans">{log.actor || log.actorName || 'System'}</td>
                  <td className="p-4 text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
