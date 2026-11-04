import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Clock, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Shield, 
  FileText, 
  Calendar, 
  Eye, 
  ArrowRight,
  HardDrive,
  Cpu,
  Lock,
  Camera,
  Activity
} from 'lucide-react';
import { api } from '../services/api';
import { TimelineItem, Case } from '../types';

export const TimelinePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const caseIdParam = searchParams.get('case_id');

  const [items, setItems] = useState<TimelineItem[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<string>(caseIdParam || 'ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const [timelineData, caseList] = await Promise.all([
        api.getTimeline(selectedCase !== 'ALL' ? { case_id: selectedCase } : undefined),
        api.getCases()
      ]);
      setItems(timelineData);
      setCases(caseList);
    } catch (e) {
      console.error('Failed to load forensic timeline:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [selectedCase]);

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      (item.evidence_id && item.evidence_id.toLowerCase().includes(search.toLowerCase())) ||
      (item.case_id && item.case_id.toLowerCase().includes(search.toLowerCase()));

    const matchesType = filterType === 'ALL' || item.source === filterType;

    return matchesSearch && matchesType;
  });

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'ARTIFACT_METADATA':
        return <Camera className="w-3.5 h-3.5 text-cyan-400" />;
      case 'PLATFORM_EVENT':
        return <Activity className="w-3.5 h-3.5 text-sky-400" />;
      case 'CUSTODY_EVENT':
        return <Shield className="w-3.5 h-3.5 text-indigo-400" />;
      case 'WATCHDOG':
        return <Lock className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'ARTIFACT_METADATA':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'PLATFORM_EVENT':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'CUSTODY_EVENT':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'WATCHDOG':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            Primary Question: What happened, and when did it occur during this incident?
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-sky-400" />
            Unified Incident Timeline
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Correlate internal artifact metadata timestamps (EXIF capture, filesystem modification) with investigative custody handovers and verification events to establish an incident sequence.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search timeline events, artifacts, or actors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-500 font-mono"
          >
            <option value="ALL">All Cases</option>
            {cases.map(c => (
              <option key={c.case_id} value={c.case_id}>{c.case_id} — {c.title}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Sources</option>
            <option value="ARTIFACT_METADATA">Observed Artifact Metadata</option>
            <option value="PLATFORM_EVENT">Platform Acquisition / Verification</option>
            <option value="CUSTODY_EVENT">Custody Handover</option>
            <option value="WATCHDOG">Watchdog Integrity Audit</option>
          </select>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-8 text-xs text-slate-400">
          <span>Correlated Events: <strong className="text-white">{filteredItems.length}</strong></span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Artifact Observed
            </span>
            <span className="flex items-center gap-1 text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" /> Platform Audit
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No chronological timeline events match the current filter.
          </div>
        ) : (
          <div className="relative border-l border-slate-800 ml-4 space-y-6 py-2">
            {filteredItems.map((item, idx) => (
              <div key={item.id || idx} className="relative pl-6 group">
                {/* Node icon dot */}
                <div className={`absolute -left-3 top-1.5 w-6 h-6 rounded-full bg-slate-950 border-2 flex items-center justify-center ${
                  item.is_anomaly
                    ? 'border-rose-500 text-rose-400'
                    : item.source === 'ARTIFACT_METADATA'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-sky-400 text-sky-400'
                }`}>
                  {item.is_anomaly ? (
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                  ) : (
                    getSourceIcon(item.source)
                  )}
                </div>

                {/* Event Card */}
                <div className={`p-4 bg-slate-950/70 rounded-xl border transition-all ${
                  item.is_anomaly
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getSourceBadge(item.source)}`}>
                        {item.source.replace('_', ' ')}
                      </span>
                      {item.is_anomaly && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                          ANACHRONISM DETECTED
                        </span>
                      )}
                      {item.evidence_id && (
                        <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                          {item.evidence_id}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>

                  <div className="mt-3 pt-2.5 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
                    <div className="flex items-center gap-2">
                      {item.actor && <span>Actor: <strong className="text-slate-300">{item.actor}</strong></span>}
                      {item.case_id && (
                        <>
                          <span>•</span>
                          <span>Case: <strong className="text-sky-400">{item.case_id}</strong></span>
                        </>
                      )}
                    </div>

                    {item.metadata?.event_hash && (
                      <span className="text-slate-500 truncate max-w-xs" title={item.metadata.event_hash}>
                        Hash: {item.metadata.event_hash.slice(0, 16)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
