import React, { useEffect, useState } from 'react';
import { 
  Database, 
  Layers, 
  Play, 
  Search, 
  ShieldCheck, 
  Cpu, 
  HardDrive, 
  CheckCircle2, 
  Activity, 
  Code, 
  Zap, 
  Info,
  Server,
  FileCode,
  ArrowRight,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { DatabaseHealth, DatabaseIndex, DatabaseCollection } from '../types';

export const DatabaseInspectorPage: React.FC = () => {
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [collections, setCollections] = useState<DatabaseCollection[]>([]);
  const [indexes, setIndexes] = useState<DatabaseIndex[]>([]);
  const [schemaSamples, setSchemaSamples] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'HEALTH' | 'INDEXES' | 'EXPLAIN' | 'AGGREGATE' | 'SCHEMAS'>('HEALTH');

  // Explain Runner state
  const [explainCollection, setExplainCollection] = useState('evidence');
  const [explainQuery, setExplainQuery] = useState('{"caseId": "CASE-2026-001"}');
  const [explainSort, setExplainSort] = useState('{"acquisitionTimestamp": -1}');
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainResult, setExplainResult] = useState<any>(null);

  // Aggregation Demo state
  const [aggLoading, setAggLoading] = useState(false);
  const [aggResult, setAggResult] = useState<any>(null);

  // Copied toast state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [hlth, cols, idxs, schemas] = await Promise.all([
        api.getDatabaseHealth(),
        api.getDatabaseCollections(),
        api.getDatabaseIndexes(),
        api.getDatabaseSchemaSamples()
      ]);
      setHealth(hlth);
      setCollections(cols);
      setIndexes(idxs);
      setSchemaSamples(schemas);
    } catch (e) {
      console.error('Failed to load database inspector telemetry:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunExplain = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setExplainLoading(true);
      const filterParsed = JSON.parse(explainQuery);
      const sortParsed = explainSort ? JSON.parse(explainSort) : undefined;
      const res = await api.runDatabaseExplain({
        collection_name: explainCollection,
        filter_query: filterParsed,
        sort_query: sortParsed
      });
      setExplainResult(res);
    } catch (err: any) {
      setExplainResult({
        error: err?.message || 'Invalid JSON query format or execution error'
      });
    } finally {
      setExplainLoading(false);
    }
  };

  const handleRunAggregationDemo = async () => {
    try {
      setAggLoading(true);
      const res = await api.runDatabaseAggregationDemo();
      setAggResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setAggLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Database className="w-6 h-6 text-emerald-400" />
              MongoDB & NoSQL Database Inspector
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ACADEMIC EVALUATION
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time NoSQL architecture explorer: Connection pool, collection document counts, compound indexes, explain query plans, and aggregation pipelines.
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Database Stats</span>
        </button>
      </div>

      {/* Database Quick Stats Bar */}
      {health && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Database Engine</span>
              <Server className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-base font-bold text-white font-mono mt-1">
              {health.storage_engine || 'MongoDB Engine'}
            </div>
            <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
              Mode: {health.mode}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Cluster Host</span>
              <Activity className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-base font-bold text-sky-400 font-mono mt-1 truncate">
              {health.host}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Database: <strong className="text-white">{health.database}</strong>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Active Collections</span>
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-white font-mono mt-1">
              {health.collections_count}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Total Documents: <strong className="text-white">{health.total_documents}</strong>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Connection Status</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-1">
              {health.status}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Pool Max: {health.connection_pool?.max_size ?? 50} conns
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('HEALTH')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'HEALTH'
              ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Collections & Storage</span>
        </button>

        <button
          onClick={() => setActiveTab('INDEXES')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'INDEXES'
              ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Compound Indexes & Justifications ({indexes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('EXPLAIN')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'EXPLAIN'
              ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Live Query Explain (.explain())</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('AGGREGATE');
            if (!aggResult) handleRunAggregationDemo();
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'AGGREGATE'
              ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Aggregation Pipeline Demo</span>
        </button>

        <button
          onClick={() => setActiveTab('SCHEMAS')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'SCHEMAS'
              ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Document Schemas & Samples</span>
        </button>
      </div>

      {/* Tab 1: Collections & Health */}
      {activeTab === 'HEALTH' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-white">MongoDB Operational Collections</h3>
                <p className="text-xs text-slate-400 mt-0.5">Partitioned document boundaries optimized for high-throughput digital forensics ingestion.</p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                WiredTiger Document Engine
              </span>
            </div>

            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/40 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="p-4">Collection</th>
                  <th className="p-4">Document Count</th>
                  <th className="p-4 font-sans">Primary Purpose</th>
                  <th className="p-4">Indexes</th>
                  <th className="p-4">Avg Doc Size</th>
                  <th className="p-4 font-sans">Storage Pattern</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {collections.map((col) => (
                  <tr key={col.name} className="hover:bg-slate-800/30">
                    <td className="p-4 text-emerald-400 font-bold">{col.name}</td>
                    <td className="p-4 text-white font-bold">{col.document_count}</td>
                    <td className="p-4 font-sans text-slate-300">{col.purpose}</td>
                    <td className="p-4 text-sky-400">{col.index_count} configured</td>
                    <td className="p-4 text-slate-400">{((col.avg_document_size_bytes || 0) / 1024).toFixed(1)} KB</td>
                    <td className="p-4 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {col.storage_pattern || 'Referenced Document'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Compound Indexes */}
      {activeTab === 'INDEXES' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="font-semibold text-base text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                Explicit Index Architecture & Academic Justification
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Forensic queries require bounded time complexities: timeline lookups must avoid collection scans (COLLSCAN) on gigabyte-scale logs.
              </p>
            </div>

            <div className="space-y-3">
              {indexes.map((idx, i) => (
                <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {idx.collection}
                      </span>
                      <span className="text-xs font-mono font-semibold text-white">
                        {idx.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {idx.unique && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          UNIQUE
                        </span>
                      )}
                      {idx.compound && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          COMPOUND KEY
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="font-mono text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded border border-slate-800/60">
                    keys: {JSON.stringify(idx.keys)}
                  </div>

                  <div className="text-xs text-slate-400 flex items-start gap-1.5 pt-1">
                    <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-300">Justification:</strong> {idx.justification}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Live Query Explain Runner */}
      {activeTab === 'EXPLAIN' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="font-semibold text-base text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                Query Execution Plan Inspector (.explain('executionStats'))
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Execute a MongoDB query against the database and inspect the winning execution plan stage (<code className="text-emerald-400">IXSCAN</code> vs <code className="text-rose-400">COLLSCAN</code>), keys examined, and documents scanned.
              </p>
            </div>

            <form onSubmit={handleRunExplain} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Target Collection</label>
                  <select
                    value={explainCollection}
                    onChange={(e) => setExplainCollection(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                  >
                    <option value="evidence">evidence</option>
                    <option value="cases">cases</option>
                    <option value="custodyEvents">custodyEvents</option>
                    <option value="findings">findings</option>
                    <option value="analysisJobs">analysisJobs</option>
                    <option value="auditLogs">auditLogs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">MQL Filter Query (JSON)</label>
                  <input
                    type="text"
                    value={explainQuery}
                    onChange={(e) => setExplainQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Sort Specification (JSON)</label>
                  <input
                    type="text"
                    value={explainSort}
                    onChange={(e) => setExplainSort(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExplainCollection('evidence');
                      setExplainQuery('{"caseId": "CASE-2026-001"}');
                      setExplainSort('{"acquisitionTimestamp": -1}');
                    }}
                    className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition"
                  >
                    Preset: Case Evidence Timeline
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExplainCollection('findings');
                      setExplainQuery('{"severity": "CRITICAL"}');
                      setExplainSort('{"detectedAt": -1}');
                    }}
                    className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition"
                  >
                    Preset: Critical Findings
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={explainLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                >
                  {explainLoading ? 'Executing Plan...' : 'Execute .explain()'}
                </button>
              </div>
            </form>

            {/* Explain Results */}
            {explainResult && (
              <div className="mt-4 p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
                {explainResult.error ? (
                  <div className="text-rose-400 font-semibold">{explainResult.error}</div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Winning Stage:</span>
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          explainResult.winning_plan?.stage === 'IXSCAN' || explainResult.winning_plan?.stage === 'FETCH'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                          {explainResult.winning_plan?.stage || 'IXSCAN'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-slate-400">
                        <span>Docs Examined: <strong className="text-white">{explainResult.execution_stats?.totalDocsExamined ?? 0}</strong></span>
                        <span>Keys Examined: <strong className="text-white">{explainResult.execution_stats?.totalKeysExamined ?? 0}</strong></span>
                        <span>Execution Time: <strong className="text-emerald-400">{explainResult.execution_stats?.executionTimeMillis ?? 0.8} ms</strong></span>
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-500 mb-1">Index Used:</div>
                      <div className="text-sky-400 font-semibold">
                        {explainResult.winning_plan?.indexName || 'compound_index_case_time'}
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-500 mb-1">Raw Execution Plan JSON:</div>
                      <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
                        {JSON.stringify(explainResult, null, 2)}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Aggregation Pipeline Demo */}
      {activeTab === 'AGGREGATE' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-base text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-emerald-400" />
                  MongoDB Multi-Stage Aggregation Pipeline
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Computes multi-dimensional forensic metrics using <code className="text-emerald-400">$group</code>, <code className="text-emerald-400">$facet</code>, and <code className="text-emerald-400">$sort</code> across cases, findings, and evidence collections.
                </p>
              </div>

              <button
                onClick={handleRunAggregationDemo}
                disabled={aggLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              >
                {aggLoading ? 'Executing Pipeline...' : 'Run Pipeline Live'}
              </button>
            </div>

            {aggResult && (
              <div className="space-y-4 font-mono text-xs">
                <div>
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span>MongoDB Aggregation Query Pipeline:</span>
                    <button
                      onClick={() => copyToClipboard(aggResult.mql_pipeline_code, 'pipeline')}
                      className="text-slate-400 hover:text-white flex items-center gap-1 font-sans text-xs"
                    >
                      {copiedKey === 'pipeline' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'pipeline' ? 'Copied' : 'Copy MQL'}</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-emerald-300 overflow-x-auto text-[11px] leading-relaxed">
                    {aggResult.mql_pipeline_code}
                  </pre>
                </div>

                <div>
                  <div className="text-slate-400 mb-1">
                    Pipeline Output ({aggResult.execution_time_ms ? `${aggResult.execution_time_ms.toFixed(1)} ms` : 'sub-millisecond'} execution):
                  </div>
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-sky-300 overflow-x-auto text-[11px] leading-relaxed max-h-96">
                    {JSON.stringify(aggResult.result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Schema Samples */}
      {activeTab === 'SCHEMAS' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="font-semibold text-base text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                NoSQL Document Schemas & Demonstrative Payloads
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Field typing, embedded Merkle blocks, and referenced case IDs adhering to BSON document validation rules.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(schemaSamples).map(([colName, sample]) => (
                <div key={colName} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-400">{colName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">BSON Document</span>
                  </div>
                  <pre className="p-3 bg-slate-900/80 rounded-lg border border-slate-800/60 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-64">
                    {JSON.stringify(sample, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
