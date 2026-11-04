import axios from 'axios';
import { 
  Case, Evidence, ForensicFinding, VerificationRecord, 
  DashboardMetrics, WatchdogAudit, CustodyEvent, AnalysisJob,
  TimelineItem, DatabaseHealth, DatabaseCollection, DatabaseIndex,
  CaseReportData, AuditLog
} from '../types';

const API_BASE = '/api/v1';

export const api = {
  // Telemetry & Health
  getHealth: async () => {
    const res = await axios.get(`${API_BASE}/health`);
    return res.data;
  },

  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    const res = await axios.get(`${API_BASE}/dashboard/metrics`);
    return res.data;
  },

  getAuditLogs: async (params?: { resource_type?: string; actor?: string; search?: string; limit?: number }): Promise<AuditLog[]> => {
    const res = await axios.get(`${API_BASE}/audit/logs`, { params });
    return res.data;
  },

  getStats: async () => {
    const res = await axios.get(`${API_BASE}/health`);
    return res.data;
  },

  // Cases Management
  getCases: async (params?: { status?: string; priority?: string; search?: string; skip?: number; limit?: number }): Promise<Case[]> => {
    const res = await axios.get(`${API_BASE}/cases`, { params });
    return res.data;
  },

  getCaseDetail: async (caseId: string): Promise<Case> => {
    const res = await axios.get(`${API_BASE}/cases/${caseId}`);
    return res.data;
  },

  createCase: async (data: { 
    case_id?: string;
    title: string; 
    description?: string; 
    investigator?: string; 
    lead_investigator?: string;
    priority?: string; 
    classification?: string;
    tags?: string[] 
  }): Promise<Case> => {
    const res = await axios.post(`${API_BASE}/cases`, data);
    return res.data;
  },

  updateCase: async (caseId: string, data: Partial<Case>): Promise<Case> => {
    const res = await axios.patch(`${API_BASE}/cases/${caseId}`, data);
    return res.data;
  },

  archiveCase: async (caseId: string) => {
    const res = await axios.delete(`${API_BASE}/cases/${caseId}`);
    return res.data;
  },

  // Evidence Explorer
  getEvidenceList: async (params?: { case_id?: string; evidence_type?: string; verification_status?: string; search?: string; skip?: number; limit?: number }): Promise<Evidence[]> => {
    const res = await axios.get(`${API_BASE}/evidence`, { params });
    return res.data;
  },

  getEvidenceDetail: async (id: string): Promise<Evidence> => {
    const res = await axios.get(`${API_BASE}/evidence/${id}`);
    return res.data;
  },

  registerEvidence: async (formData: FormData): Promise<Evidence> => {
    const res = await axios.post(`${API_BASE}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  verifyEvidence: async (evidenceId: string, formData: FormData): Promise<VerificationRecord> => {
    const res = await axios.post(`${API_BASE}/evidence/${evidenceId}/verify`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  getEvidenceDownloadUrl: (evidenceId: string) => `${API_BASE}/evidence/${evidenceId}/download`,
  getReportUrl: (evidenceId: string) => `${API_BASE}/evidence/${evidenceId}/report.pdf`,

  // Forensic Analysis Jobs & Findings
  getAnalysisJobs: async (params?: { case_id?: string; evidence_id?: string }): Promise<AnalysisJob[]> => {
    const res = await axios.get(`${API_BASE}/analysis/jobs`, { params });
    return res.data;
  },

  createAnalysisJob: async (data: { 
    evidence_id: string; 
    job_type: string; 
    parameters?: Record<string, any>;
    case_id?: string;
  }): Promise<AnalysisJob> => {
    const res = await axios.post(`${API_BASE}/analysis/jobs`, data);
    return res.data;
  },

  getFindings: async (params?: { case_id?: string; evidence_id?: string; severity?: string; category?: string }): Promise<ForensicFinding[]> => {
    const res = await axios.get(`${API_BASE}/analysis/findings`, { params });
    return res.data;
  },

  reviewFinding: async (findingId: string, reviewedBy: string, reviewNotes?: string): Promise<ForensicFinding> => {
    const res = await axios.patch(`${API_BASE}/analysis/findings/${findingId}/review`, {
      is_reviewed: true,
      reviewed_by: reviewedBy,
      review_notes: reviewNotes
    });
    return res.data;
  },

  // Chain of Custody & Hash Chain Verification
  getCustodyEvents: async (params?: { case_id?: string; evidence_id?: string }): Promise<CustodyEvent[]> => {
    const res = await axios.get(`${API_BASE}/custody`, { params });
    return res.data;
  },

  transferCustody: async (data: { 
    evidence_id: string; 
    action?: string;
    to_custodian: string; 
    reason: string; 
    location?: string;
    authorization_ref?: string;
    notes?: string;
  }): Promise<CustodyEvent> => {
    const res = await axios.post(`${API_BASE}/custody/transfer`, data);
    return res.data;
  },

  verifyCustodyChain: async (evidenceId: string): Promise<{ 
    valid: boolean; 
    evidence_id: string; 
    events_count: number; 
    message: string; 
    broken_at_index?: number;
  }> => {
    const res = await axios.get(`${API_BASE}/evidence/${evidenceId}/custody/verify`);
    return res.data;
  },

  // Unified Investigation Timeline
  getTimeline: async (params?: { case_id?: string; evidence_id?: string }): Promise<TimelineItem[]> => {
    const res = await axios.get(`${API_BASE}/timeline`, { params });
    return res.data;
  },
  getUnifiedTimeline: async (caseId?: string): Promise<TimelineItem[]> => {
    const res = await axios.get(`${API_BASE}/timeline`, { params: { case_id: caseId } });
    return res.data;
  },

  // Reports
  getCaseReportJson: async (caseId: string): Promise<CaseReportData> => {
    const res = await axios.get(`${API_BASE}/cases/${caseId}/report.json`);
    return res.data;
  },

  getCaseReportPdfUrl: (caseId: string) => `${API_BASE}/cases/${caseId}/report.pdf`,
  getReportPdfUrl: (caseId: string) => `${API_BASE}/cases/${caseId}/report.pdf`,

  // Database Inspector (NoSQL Evaluation Feature)
  getDatabaseHealth: async (): Promise<DatabaseHealth> => {
    const res = await axios.get(`${API_BASE}/database/health`);
    return res.data;
  },

  getDatabaseCollections: async (): Promise<DatabaseCollection[]> => {
    const res = await axios.get(`${API_BASE}/database/collections`);
    return res.data;
  },

  getDatabaseIndexes: async (): Promise<DatabaseIndex[]> => {
    const res = await axios.get(`${API_BASE}/database/indexes`);
    return res.data;
  },

  getDatabaseSchemaSamples: async (): Promise<Record<string, any>> => {
    const res = await axios.get(`${API_BASE}/database/schema-samples`);
    return res.data;
  },

  runDatabaseExplain: async (payload: { collection_name: string; filter_query: Record<string, any>; sort_query?: Record<string, any> }) => {
    const res = await axios.post(`${API_BASE}/database/explain`, payload);
    return res.data;
  },

  runQueryExplain: async (collection: string, filter: Record<string, any>, sort?: string) => {
    const res = await axios.post(`${API_BASE}/database/explain`, { collection_name: collection, filter_query: filter });
    return res.data;
  },

  runDatabaseAggregationDemo: async () => {
    const res = await axios.get(`${API_BASE}/database/aggregate-demo`);
    return res.data;
  },

  seedDemonstrationData: async () => {
    const res = await axios.post(`${API_BASE}/database/seed`);
    return res.data;
  },

  seedDatabase: async () => {
    const res = await axios.post(`${API_BASE}/database/seed`);
    return res.data;
  },

  // Watchdog Daemon
  getWatchdogStatus: async () => {
    const res = await axios.get(`${API_BASE}/watchdog/status`);
    return res.data;
  },

  getWatchdogAudits: async (): Promise<WatchdogAudit[]> => {
    const res = await axios.get(`${API_BASE}/watchdog/audits`);
    return res.data;
  },

  triggerWatchdog: async () => {
    const res = await axios.post(`${API_BASE}/watchdog/run-check`);
    return res.data;
  }
};
