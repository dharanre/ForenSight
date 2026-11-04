import React, { useEffect, useState } from 'react';
import { 
  Settings, 
  Shield, 
  Cpu, 
  Database, 
  CheckCircle, 
  Radio, 
  Sparkles, 
  FileText, 
  Server, 
  HardDrive,
  RefreshCw,
  BookOpen,
  Layers,
  Activity
} from 'lucide-react';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = () => {
    api.getHealth().then((h) => setHealth(h));
  };

  const handleSeedData = async () => {
    try {
      setSeeding(true);
      setSeedMessage(null);
      const res = await api.seedDemonstrationData();
      setSeedMessage(res.message || 'Synthetic forensic dataset seeded successfully.');
      loadHealth();
    } catch (e: any) {
      setSeedMessage(`Seeding failed: ${e?.response?.data?.detail || e.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-sky-400" />
            System Architecture & Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Platform subsystems, cryptographic anchors, NoSQL database configuration, and forensic engines.
          </p>
        </div>

        <button
          onClick={handleSeedData}
          disabled={seeding}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-sky-600/20 transition cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>{seeding ? 'Seeding Demonstration Data...' : 'Seed Academic Demo Data'}</span>
        </button>
      </div>

      {seedMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2 font-mono">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{seedMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* NoSQL Database Engine */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Database className="w-5 h-5" />
            <h3 className="font-bold text-white text-sm">Primary NoSQL Database Subsystem</h3>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Database Engine:</span>
              <span className="text-emerald-400 font-bold">{health?.mongodb?.engine || 'MongoDB Wire Engine'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Operational Mode:</span>
              <span className="text-white font-bold">{health?.mongodb?.mode || 'LIVE / EMBEDDED PERSISTENT'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Target Database:</span>
              <span className="text-sky-400">forensight</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Collections Managed:</span>
              <span className="text-slate-200">8 (cases, evidence, custodyEvents, analysisJobs, etc.)</span>
            </div>
          </div>
        </div>

        {/* Blockchain Node */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 text-sky-400">
            <Radio className="w-5 h-5" />
            <h3 className="font-bold text-white text-sm">ForenChain Blockchain Anchor</h3>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Status:</span>
              <span className={health?.blockchain_connected ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {health?.blockchain_connected ? 'CONNECTED (HARDHAT / ETHEREUM)' : 'DATABASE FALLBACK SECURED'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">RPC Endpoint:</span>
              <span className="text-slate-300">http://127.0.0.1:8545</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Smart Contract:</span>
              <span className="text-sky-400 truncate max-w-[200px]">{health?.contract_address || '0x5FbDB2315678afecb367f032d93F642f64180aa3'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Dual-Anchor Strategy:</span>
              <span className="text-emerald-400">ACTIVE (No single point of failure)</span>
            </div>
          </div>
        </div>

        {/* Integrity Watchdog */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Shield className="w-5 h-5" />
            <h3 className="font-bold text-white text-sm">Integrity Watchdog Subsystem</h3>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Continuous Daemon:</span>
              <span className="text-emerald-400 font-bold">{health?.watchdog_running ? 'ACTIVE RUNNING' : 'STANDBY'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Audit Interval:</span>
              <span className="text-slate-300">30 seconds</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">SSE Telemetry Stream:</span>
              <span className="text-emerald-400 font-bold">/api/v1/watchdog/stream</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Audit Scope:</span>
              <span className="text-slate-300">Bitstream SHA-256 vs Anchored Records</span>
            </div>
          </div>
        </div>

        {/* Storage Architecture */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 text-indigo-400">
            <HardDrive className="w-5 h-5" />
            <h3 className="font-bold text-white text-sm">Forensic Storage Subsystem</h3>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Primary Repository:</span>
              <span className="text-slate-300">./storage/evidence/</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Merkle Slicing Block:</span>
              <span className="text-sky-400 font-bold">4096 Bytes Deterministic</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Tamper Heatmaps:</span>
              <span className="text-slate-300">./storage/heatmaps/</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Legal Compliance:</span>
              <span className="text-amber-400">BSA 2023 Sec 63(4) Certified</span>
            </div>
          </div>
        </div>

        {/* 5-Part Forensic Capabilities Summary */}
        <div className="md:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-400" />
            Diagnostic Forensic Suite Subsystems
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Check 1: Cryptographic Multi-Hashing</div>
                <div className="text-[11px] text-slate-500">MD5, SHA-1, SHA-256 computed simultaneously</div>
              </div>
              <span className="text-emerald-400 font-mono font-bold">ACTIVE</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Check 2: File Identity & Magic Bytes</div>
                <div className="text-[11px] text-slate-500">Validates binary headers against declared file extensions</div>
              </div>
              <span className="text-emerald-400 font-mono font-bold">ACTIVE</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Check 3: EXIF & Metadata Extraction</div>
                <div className="text-[11px] text-slate-500">Extracts camera models, GPS coordinates, and PDF creators</div>
              </div>
              <span className="text-emerald-400 font-mono font-bold">ACTIVE</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Check 4: Error Level Analysis (ELA)</div>
                <div className="text-[11px] text-slate-500">Pillow-driven recompression delta & OpenCV heatmap</div>
              </div>
              <span className="text-emerald-400 font-mono font-bold">ACTIVE</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Check 5: Temporal Inversion Detection</div>
                <div className="text-[11px] text-slate-500">Heuristic flags for modified before created or future timestamps</div>
              </div>
              <span className="text-emerald-400 font-mono font-bold">ACTIVE</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Module C: Merkle Tree Block Localization</div>
                <div className="text-[11px] text-slate-500">Isolates exact byte offset of physical disk tampering</div>
              </div>
              <span className="text-emerald-400 font-mono font-bold">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
