import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Upload, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Plus, 
  ArrowRight, 
  Clock, 
  Layers, 
  Activity, 
  CheckCircle2, 
  HelpCircle,
  X,
  ChevronRight,
  HardDrive
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardMetrics, Case } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTourModal, setShowTourModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsData, casesData] = await Promise.all([
        api.getDashboardMetrics(),
        api.getCases()
      ]);
      setMetrics(metricsData);
      setCases(casesData);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'MEDIUM':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-sky-400" />
            Investigation Workspace
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage digital forensic cases, verify evidence bitstream integrity, and track chain of custody.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTourModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-800 transition"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Quick Tour</span>
          </button>

          <Link
            to="/workspace/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Start an Investigation</span>
          </Link>
        </div>
      </div>

      {/* Welcome Banner for Empty / First-Time State */}
      {cases.length === 0 && !loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
              FIRST TIME INVESTIGATOR
            </span>
            <h2 className="text-xl font-bold text-white">Let's start your first investigation.</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              ForenSight guides you through case creation, bitstream evidence acquisition, deterministic 4096-byte Merkle block slicing, and court-admissible statutory reports.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link
                to="/workspace/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-md transition"
              >
                <span>Create Your First Case</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setShowTourModal(true)}
                className="text-xs text-slate-400 hover:text-white px-3 py-2"
              >
                Take a Quick Tour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Navigation Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/cases"
          className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white group-hover:text-sky-300 transition">
                Continue an Investigation
              </div>
              <p className="text-[11px] text-slate-400">Browse and manage ongoing case dockets</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition" />
        </Link>

        <Link
          to="/register"
          className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white group-hover:text-emerald-300 transition">
                Register Evidence
              </div>
              <p className="text-[11px] text-slate-400">Stream bitstream artifact into a case</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition" />
        </Link>

        <Link
          to="/reports"
          className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition">
                View Reports
              </div>
              <p className="text-[11px] text-slate-400">Export PDF & Section 63(4) certificates</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition" />
        </Link>
      </div>

      {/* 4 Compact Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Total Cases</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            {metrics?.summary.totalCases ?? cases.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {metrics?.summary.activeCases ?? cases.length} active investigations
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Evidence Cataloged</div>
          <div className="text-2xl font-bold text-sky-400 font-mono mt-1">
            {metrics?.summary.totalEvidence ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            4096-Byte Merkle sliced
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Integrity Score</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
            {metrics?.summary.integrityScore ?? 100}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {metrics?.summary.verifiedEvidence ?? 0} verified intact
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Outstanding Findings</div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
            {(metrics?.summary.criticalFindings || 0) + (metrics?.summary.highFindings || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Requires examiner review
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Investigations & Outstanding Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Investigations */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-sky-400" />
              Active Investigations
            </h3>
            <Link to="/cases" className="text-xs text-sky-400 hover:text-sky-300 font-medium">
              View All Cases
            </Link>
          </div>

          {cases.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No investigations created yet. Click "Start an Investigation" to begin.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {cases.slice(0, 5).map((c) => (
                <div key={c.id || c.case_id} className="p-4 hover:bg-slate-800/30 transition flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                        {c.case_id || c.id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityBadge(c.priority || 'MEDIUM')}`}>
                        {c.priority || 'MEDIUM'}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white">{c.title}</div>
                    <div className="text-xs text-slate-400">
                      Lead: {c.lead_investigator || c.investigator || 'Examiner'} • {c.evidence_count ?? 0} evidence items
                    </div>
                  </div>

                  <Link
                    to={`/evidence?case_id=${c.case_id || c.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
                  >
                    <span>Open Case</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Outstanding Actions & Recent Activity */}
        <div className="lg:col-span-4 space-y-6">
          {/* Outstanding Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Action Items
            </h3>

            <div className="space-y-2.5 text-xs">
              <Link
                to="/analysis"
                className="p-3 bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl flex items-start gap-2.5 transition block"
              >
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
                <div>
                  <div className="font-semibold text-white">Review Diagnostic Findings</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {(metrics?.summary.criticalFindings || 0) + (metrics?.summary.highFindings || 0)} high/critical findings pending sign-off.
                  </p>
                </div>
              </Link>

              <Link
                to="/verify"
                className="p-3 bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl flex items-start gap-2.5 transition block"
              >
                <div className="w-2 h-2 rounded-full bg-sky-400 mt-1 shrink-0" />
                <div>
                  <div className="font-semibold text-white">Candidate Copy Verification</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Compare suspect files against baseline Merkle manifests.
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              Recent Platform Activity
            </h3>

            <div className="space-y-3 text-xs">
              {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
                metrics.recentActivity.slice(0, 4).map((log, i) => (
                  <div key={i} className="pb-2 border-b border-slate-800/60 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span className="font-mono text-sky-400 font-semibold">{log.action}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-slate-300 font-medium text-[11px] mt-0.5">
                      {log.resourceType}: <strong className="text-white">{log.resourceId}</strong>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-[11px]">No recent audit events recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tour Modal */}
      {showTourModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                Quick Platform Tour
              </h2>
              <button
                onClick={() => setShowTourModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-300 leading-relaxed">
              <p>
                Welcome to <strong>ForenSight</strong>, a digital forensics investigation platform designed for reliable evidence preservation and traceable auditing.
              </p>

              <div className="space-y-2 pt-2">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <strong className="text-white block">1. Start with an Investigation</strong>
                  <span className="text-slate-400">Click "Start an Investigation" to use the 5-step guided wizard.</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <strong className="text-white block">2. Verify Integrity Anytime</strong>
                  <span className="text-slate-400">Use "Integrity Verification" to compare suspect files against baseline hashes.</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <strong className="text-white block">3. Maintain Chain of Custody</strong>
                  <span className="text-slate-400">Record all handovers with SHA-256 parent-child hash chaining.</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <strong className="text-white block">4. Generate Court Reports</strong>
                  <span className="text-slate-400">Export PDF reports with Section 63(4) BSA compliance declarations.</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowTourModal(false)}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-md transition"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
