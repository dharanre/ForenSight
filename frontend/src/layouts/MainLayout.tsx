import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Bell, ShieldCheck, Database, RefreshCw, Plus, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

export const MainLayout: React.FC = () => {
  const [databaseEngine, setDatabaseEngine] = useState<string>('MongoDB Operational');
  const [alerts, setAlerts] = useState<string[]>([]);
  const [watchdogRunning, setWatchdogRunning] = useState(true);
  const location = useLocation();

  const fetchHealth = () => {
    api.getHealth()
      .then((data) => {
        setDatabaseEngine(data.database?.engine || 'MongoDB Operational');
        setWatchdogRunning(data.watchdog_running || data.watchdog?.running || true);
      })
      .catch(() => {
        setDatabaseEngine('MongoDB Standalone');
      });
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 20000);

    // Connect SSE for live notifications
    const eventSource = new EventSource('/api/v1/events/stream');
    eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.event_type === 'WATCHDOG_ALERT') {
          setAlerts((prev) => [`[Watchdog Alert] ${payload.data.alert} on ${payload.data.evidence_id}`, ...prev.slice(0, 9)]);
        } else if (payload.event_type === 'EVIDENCE_REGISTERED' || payload.event_type === 'EVIDENCE_ACQUIRED') {
          setAlerts((prev) => [`[Evidence Intake] ${payload.data.filename || payload.data.evidence_id} registered`, ...prev.slice(0, 9)]);
        }
      } catch (err) {}
    };

    return () => {
      clearInterval(interval);
      eventSource.close();
    };
  }, []);

  const getSectionTitle = (path: string) => {
    if (path === '/workspace' || path === '/') return 'Workspace Home';
    if (path.startsWith('/workspace/new')) return 'New Investigation Wizard';
    if (path.startsWith('/cases')) return 'Investigations';
    if (path.startsWith('/evidence')) return 'Evidence Repository';
    if (path.startsWith('/reports')) return 'Case Reports';
    if (path.startsWith('/verify')) return 'Integrity Verification';
    if (path.startsWith('/analysis')) return 'Artifact Analysis';
    if (path.startsWith('/custody')) return 'Chain of Custody';
    if (path.startsWith('/timeline')) return 'Investigation Timeline';
    if (path.startsWith('/database')) return 'Database & Diagnostics';
    if (path.startsWith('/audit')) return 'Operational Audit Log';
    if (path.startsWith('/docs')) return 'Platform Documentation';
    if (path.startsWith('/settings')) return 'System Settings';
    return 'Investigation Workspace';
  };

  return (
    <div className="flex bg-slate-950 text-slate-100 min-h-screen font-sans antialiased selection:bg-sky-500/30 selection:text-sky-200">
      <Sidebar databaseEngine={databaseEngine} />
      
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-800/80 border border-slate-700/60 rounded text-slate-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              FORENSIC WORKSPACE
            </span>
            <span className="text-xs text-slate-500">/</span>
            <span className="text-xs text-slate-300 font-medium">
              {getSectionTitle(location.pathname)}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick New Investigation Action */}
            <Link
              to="/workspace/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Investigation</span>
            </Link>

            {/* Notification alert counter */}
            {alerts.length > 0 && (
              <div 
                className="flex items-center space-x-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded cursor-pointer hover:bg-amber-500/20 transition-all"
                title={alerts[0]}
                onClick={() => setAlerts([])}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{alerts.length} Alert{alerts.length > 1 ? 's' : ''}</span>
              </div>
            )}

            <button 
              onClick={fetchHealth} 
              title="Refresh telemetry"
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 md:p-8 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
