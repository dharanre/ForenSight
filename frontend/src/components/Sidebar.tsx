import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  FileSearch, 
  CheckCircle2, 
  Layers, 
  Clock, 
  FileText, 
  Settings, 
  Briefcase, 
  Database, 
  Cpu, 
  Link2,
  Activity,
  BookOpen,
  Home,
  ExternalLink
} from 'lucide-react';

interface SidebarProps {
  blockchainConnected?: boolean;
  databaseEngine?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ databaseEngine }) => {
  const navSections = [
    {
      title: 'WORKSPACE',
      items: [
        { to: '/workspace', label: 'Workspace Home', icon: Home },
        { to: '/cases', label: 'Investigations', icon: Briefcase },
        { to: '/evidence', label: 'Evidence', icon: Layers },
        { to: '/reports', label: 'Reports', icon: FileText },
      ]
    },
    {
      title: 'FORENSIC TOOLS',
      items: [
        { to: '/verify', label: 'Integrity Verification', icon: CheckCircle2 },
        { to: '/analysis', label: 'Artifact Analysis', icon: Cpu },
        { to: '/custody', label: 'Chain of Custody', icon: Link2 },
        { to: '/timeline', label: 'Investigation Timeline', icon: Clock },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { to: '/database', label: 'Database & Diagnostics', icon: Database },
        { to: '/audit', label: 'Audit Log', icon: Activity },
        { to: '/docs', label: 'Documentation', icon: BookOpen },
        { to: '/settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <Link to="/workspace" className="flex items-center space-x-3 group">
          <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400 group-hover:bg-sky-500/20 transition">
            <FileSearch className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white tracking-wide">
              FORENSIGHT
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">INVESTIGATION SUITE</p>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto custom-scrollbar">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h2 className="px-3 text-[10px] font-semibold text-slate-500 tracking-wider uppercase font-mono">
              {section.title}
            </h2>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/workspace'}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Return to Public Site */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70 space-y-2">
        <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded">
          <div className="flex items-center space-x-2 text-slate-400">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-[10px]">MongoDB WiredTiger</span>
          </div>
          <Link
            to="/database"
            className="text-[10px] font-semibold text-sky-400 hover:text-sky-300"
          >
            Diagnostics
          </Link>
        </div>

        <Link
          to="/"
          className="flex items-center justify-center gap-1.5 w-full py-1.5 text-[11px] text-slate-400 hover:text-white rounded border border-slate-800 hover:bg-slate-800 transition"
        >
          <span>Public Overview Page</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </aside>
  );
};
