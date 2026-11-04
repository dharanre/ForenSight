import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  FolderOpen,
  ChevronRight,
  Tag,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { Case } from '../types';

export const CasesPage: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [newCaseId, setNewCaseId] = useState(`CASE-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [newInvestigator, setNewInvestigator] = useState('Senior Forensic Examiner');
  const [newClassification, setNewClassification] = useState('CONFIDENTIAL');
  const [newTags, setNewTags] = useState('tampering, financial, storage');

  const loadCases = async () => {
    try {
      setLoading(true);
      const data = await api.getCases();
      setCases(data);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setError('Please provide a case title.');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      await api.createCase({
        case_id: newCaseId,
        title: newTitle,
        description: newDescription,
        priority: newPriority,
        lead_investigator: newInvestigator,
        classification: newClassification,
        tags: newTags.split(',').map(t => t.trim()).filter(Boolean)
      });
      setShowModal(false);
      // Reset form
      setNewCaseId(`CASE-2026-${Math.floor(100 + Math.random() * 900)}`);
      setNewTitle('');
      setNewDescription('');
      loadCases();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create case');
    } finally {
      setCreating(false);
    }
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      (c.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.case_id || c.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.lead_investigator || c.investigator || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || c.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'IN_REVIEW':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'CLOSED':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold text-sky-400 uppercase tracking-wider">
            INVESTIGATOR QUESTION: WHAT CASES AM I WORKING ON?
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 mt-0.5">
            <Briefcase className="w-6 h-6 text-sky-400" />
            Active Investigations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Searchable docket of all digital forensic cases, evidence inventories, and lead examiner assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/workspace/new"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            <span>Guided Wizard</span>
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-sky-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Case</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by case title, ID, investigator, or synopsis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Cases Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Forensic Cases Found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            {search || statusFilter !== 'ALL' || priorityFilter !== 'ALL' 
              ? 'No cases match your active filters. Try resetting search criteria.'
              : 'Initialize your first digital investigation case to start registering evidence.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCases.map((c) => (
            <div
              key={c.id || c.case_id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                    {c.case_id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityBadge(c.priority || 'MEDIUM')}`}>
                      {c.priority || 'MEDIUM'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(c.status || 'ACTIVE')}`}>
                      {c.status}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-white group-hover:text-sky-300 transition-colors">
                  {c.title}
                </h3>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {c.description || 'No detailed case synopsis provided.'}
                </p>

                {c.tags && c.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {c.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-800/80 text-slate-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5 text-slate-500" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80">
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-3">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{c.lead_investigator || c.investigator || 'Lead Examiner'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{c.created_at || c.createdAt ? new Date(c.created_at || c.createdAt || '').toLocaleDateString() : 'Recent'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-mono text-slate-400">
                    {c.evidence_count ?? 0} evidence item{c.evidence_count === 1 ? '' : 's'}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/reports?case_id=${c.case_id}`}
                      className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
                      title="View Case Report"
                    >
                      Report
                    </Link>
                    <Link
                      to={`/evidence?case_id=${c.case_id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 px-2.5 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 transition"
                    >
                      <span>Explore</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Case Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-sky-400" />
                Initialize New Investigation Case
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Case Identifier</label>
                  <input
                    type="text"
                    value={newCaseId}
                    onChange={(e) => setNewCaseId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-sky-400 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority Level</label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Investigation Title</label>
                <input
                  type="text"
                  placeholder="e.g. Operation Deep Storage Tamper Audit"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Case Synopsis & Objectives</label>
                <textarea
                  rows={3}
                  placeholder="Summarize evidence seizure circumstances, suspected forensic manipulation, and target scope..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Lead Investigator</label>
                  <input
                    type="text"
                    value={newInvestigator}
                    onChange={(e) => setNewInvestigator(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Security Classification</label>
                  <select
                    value={newClassification}
                    onChange={(e) => setNewClassification(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="UNCLASSIFIED">Unclassified</option>
                    <option value="RESTRICTED">Restricted</option>
                    <option value="CONFIDENTIAL">Confidential</option>
                    <option value="TOP_SECRET">Top Secret</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="financial, ransomware, internal-audit"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-lg shadow-sky-600/20 transition cursor-pointer"
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Create Case Record</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
