export interface Case {
  id: string;
  _id?: string;
  case_id?: string;
  caseId?: string;
  caseNumber?: string;
  title: string;
  description?: string;
  investigator?: string;
  lead_investigator?: string;
  investigatorName?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'UNDER_REVIEW' | 'IN_REVIEW' | 'OPEN' | 'ARCHIVED' | 'CLOSED';
  classification?: string;
  tags?: string[];
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  closedAt?: string;
  evidence_count?: number;
  evidenceCount?: number;
  findingsCount?: number;
  evidence?: Evidence[];
  evidences?: Evidence[];
  custodyEvents?: CustodyEvent[];
  findings?: ForensicFinding[];
  auditLogs?: AuditLog[];
  evidenceSummary?: {
    total: number;
    verified: number;
    mismatches: number;
    pending: number;
  };
}

export interface ForensicFinding {
  id: string;
  _id?: string;
  evidenceId?: string;
  evidence_id?: string;
  caseId?: string;
  analysisJobId?: string;
  category?: string;
  check_category?: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  confidence_score?: number;
  supportingArtifactReferences?: any[];
  supporting_observations?: Record<string, any>;
  measurements?: Record<string, any>;
  confidence?: string;
  recommendation?: string;
  isReviewed?: boolean;
  is_reviewed?: boolean;
  reviewedBy?: string;
  reviewed_by?: string;
  reviewNotes?: string;
  review_notes?: string;
  createdAt?: string;
  created_at?: string;
  detected_at?: string;
}

export interface CustodyEvent {
  id: string;
  _id?: string;
  evidenceId?: string;
  evidence_id?: string;
  caseId?: string;
  timestamp?: string;
  occurredAt?: string;
  recordedAt?: string;
  eventType?: string;
  event_type?: string;
  action?: string;
  actor?: string;
  actorName?: string;
  fromCustodian?: string;
  from_custodian?: string;
  toCustodian?: string;
  to_custodian?: string;
  reason?: string;
  location?: string;
  authorization_ref?: string;
  notes?: string;
  details?: Record<string, any>;
  previousEventId?: string;
  previous_event_id?: string;
  previousEventHash?: string;
  prev_event_hash?: string;
  eventHash?: string;
  event_hash?: string;
  event_record_hash?: string;
  anchoredOnChain?: boolean;
  anchored_on_chain?: boolean;
  blockchainTxHash?: string;
  blockchain_tx_hash?: string;
}

export interface VerificationRecord {
  id: string;
  evidenceId?: string;
  evidence_id?: string;
  candidateFilename?: string;
  candidate_filename?: string;
  candidateFileSize?: number;
  candidate_size_bytes?: number;
  candidateSha256?: string;
  candidate_sha256?: string;
  candidateMd5?: string;
  candidate_md5?: string;
  candidateSha1?: string;
  candidate_sha1?: string;
  candidateMerkleRoot?: string;
  candidate_merkle_root?: string;
  exactMatch?: boolean;
  exact_match?: boolean;
  totalBlocksCompared?: number;
  total_blocks_compared?: number;
  matchingBlocksCount?: number;
  matching_blocks_count?: number;
  matchingPercentage?: number;
  matching_blocks_percentage?: number;
  differingBlocksCount?: number;
  differing_blocks_count?: number;
  differingPercentage?: number;
  differing_blocks_percentage?: number;
  byteRangesDiff?: Array<{ start: number; end: number; length: number }>;
  byte_ranges_diff?: Array<{ start: number; end: number; length: number }>;
  perceptual_hash_distance?: number;
  visual_similarity_percentage?: number;
  tamper_heatmap_path?: string;
  tamperHeatmapUrl?: string;
  ela_result_path?: string;
  verifiedAt?: string;
  verified_at?: string;
  verifier: string;
  status: string;
}

export interface Evidence {
  id: string;
  _id?: string;
  caseId?: string;
  case_id?: string;
  evidenceNumber?: string;
  evidence_number?: string;
  originalFilename?: string;
  original_filename?: string;
  fileSize?: number;
  file_size_bytes?: number;
  claimedExtension?: string;
  claimed_extension?: string;
  detectedFileType?: string;
  detected_mime_type?: string;
  evidenceType?: string;
  sha256: string;
  md5: string;
  sha1: string;
  blockSizeBytes?: number;
  block_size_bytes?: number;
  totalBlocks?: number;
  total_blocks?: number;
  merkleRoot?: string;
  merkle_root?: string;
  storageReference?: string;
  storage_path?: string;
  acquisitionMetadata?: {
    sourceDevice?: string;
    acquisitionOperator?: string;
    acquisitionNotes?: string;
    claimedExtension?: string;
    blockSizeBytes?: number;
    totalBlocks?: number;
    merkleRoot?: string;
    manifestPath?: string;
  };
  acquisitionTimestamp?: string;
  acquired_at?: string;
  acquiredBy?: string;
  acquisition_operator?: string;
  acquisition_notes?: string;
  source_device?: string;
  analysis_status?: string;
  anchoring_status?: 'ANCHORED_CHAIN' | 'FALLBACK_DB' | 'DB_FALLBACK' | 'NOT_ANCHORED' | 'PENDING';
  blockchain_tx_hash?: string;
  blockchain_block_number?: number;
  analysis_report_hash?: string;
  integrity_status?: 'VERIFIED' | 'MISMATCH_DETECTED' | 'ERROR' | 'MISSING_FROM_STORAGE' | 'COMPROMISED' | 'TAMPERED';
  verificationStatus?: 'VERIFIED' | 'MISMATCH_DETECTED' | 'PENDING' | 'ERROR';
  lastVerifiedAt?: string;
  last_verified_at?: string;
  createdAt?: string;
  findings?: ForensicFinding[];
  custody_events?: CustodyEvent[];
  custodyEvents?: CustodyEvent[];
  verifications?: VerificationRecord[];
}

export interface AnalysisJob {
  id?: string;
  job_id?: string | number;
  _id?: string;
  caseId?: string;
  case_id?: string;
  evidenceId?: string;
  evidence_id?: string;
  analysisType?: string;
  job_type?: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  toolName?: string;
  toolVersion?: string;
  parameters?: Record<string, any>;
  startedAt?: string;
  created_at?: string;
  completedAt?: string;
  execution_time_ms?: number;
  errorSummary?: string;
  findingsCount?: number;
}

export interface AuditLog {
  id?: string;
  _id?: string;
  actorId?: string;
  actorName?: string;
  actor?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  timestamp: string;
  sanitizedDetails?: Record<string, any>;
}

export interface TimelineItem {
  id: string;
  timestamp: string;
  timestampType?: 'SYSTEM_GENERATED' | 'OBSERVED_ARTIFACT';
  source: string;
  category?: 'CUSTODY' | 'ACQUISITION' | 'FINDING' | 'AUDIT';
  title: string;
  description: string;
  actor?: string;
  evidenceId?: string;
  evidence_id?: string;
  caseId?: string;
  case_id?: string;
  is_anomaly?: boolean;
  eventHash?: string;
  anchored?: boolean;
  severity?: string;
  metadata?: Record<string, any>;
}

export interface WatchdogAudit {
  id: string;
  _id?: string;
  runTimestamp?: string;
  run_timestamp?: string;
  totalChecked?: number;
  total_checked?: number;
  totalPassed?: number;
  total_passed?: number;
  totalMismatches?: number;
  total_mismatches?: number;
  totalMissing?: number;
  total_missing?: number;
  details?: any;
  status: string;
}

export interface DashboardMetrics {
  summary: {
    totalCases: number;
    activeCases: number;
    closedCases: number;
    totalEvidence: number;
    verifiedEvidence: number;
    mismatchEvidence: number;
    pendingEvidence: number;
    integrityScore: number;
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
  };
  evidenceTypeBreakdown: Array<{ type: string; count: number }>;
  caseStatusDistribution: Array<{ status: string; count: number }>;
  recentActivity: AuditLog[];
  recentCases: Case[];
  databaseEngine: string;
  timestamp: string;
}

export interface DatabaseHealth {
  engine?: string;
  storage_engine?: string;
  mode?: string;
  host: string;
  database?: string;
  databaseName?: string;
  status?: string;
  isConnected?: boolean;
  collections_count?: number;
  totalCollections?: number;
  total_documents?: number;
  pingLatencyMs?: number;
  connection_pool?: {
    max_size?: number;
    active_connections?: number;
  };
  timestamp: string;
}

export interface DatabaseCollection {
  name: string;
  documentCount?: number;
  document_count?: number;
  indexCount?: number;
  index_count?: number;
  indexes?: string[];
  purpose?: string;
  avg_document_size_bytes?: number;
  storage_pattern?: string;
}

export interface DatabaseIndex {
  collection: string;
  name: string;
  keys: any;
  isUnique?: boolean;
  unique?: boolean;
  isCompound?: boolean;
  compound?: boolean;
  justification: string;
}

export interface CaseReportData {
  case: Case;
  evidence_items: Evidence[];
  findings: ForensicFinding[];
  custody_events: CustodyEvent[];
  summary: {
    total_evidence: number;
    verified_intact: number;
    total_findings: number;
    custody_events_count: number;
  };
  generated_at: string;
}
