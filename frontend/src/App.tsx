import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { InvestigationWizardPage } from './pages/InvestigationWizardPage';
import { CasesPage } from './pages/CasesPage';
import { RegisterPage } from './pages/RegisterPage';
import { EvidenceDetailPage } from './pages/EvidenceDetailPage';
import { VerifyPage } from './pages/VerifyPage';
import { EvidenceListPage } from './pages/EvidenceListPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { CustodyPage } from './pages/CustodyPage';
import { WatchdogPage } from './pages/WatchdogPage';
import { TimelinePage } from './pages/TimelinePage';
import { ReportsPage } from './pages/ReportsPage';
import { DatabaseInspectorPage } from './pages/DatabaseInspectorPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Homepage */}
        <Route path="/" element={<HomePage />} />

        {/* Authenticated / Protected Workspace Shell */}
        <Route element={<MainLayout />}>
          <Route path="workspace" element={<DashboardPage />} />
          <Route path="workspace/new" element={<InvestigationWizardPage />} />

          {/* Core Investigations & Evidence */}
          <Route path="cases" element={<CasesPage />} />
          <Route path="investigations" element={<CasesPage />} />
          <Route path="evidence" element={<EvidenceListPage />} />
          <Route path="evidence/:id" element={<EvidenceDetailPage />} />
          <Route path="register" element={<RegisterPage />} />

          {/* Forensic Tools */}
          <Route path="verify" element={<VerifyPage />} />
          <Route path="analysis" element={<AnalysisPage />} />
          <Route path="custody" element={<CustodyPage />} />
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="reports" element={<ReportsPage />} />

          {/* System & Evaluation */}
          <Route path="database" element={<DatabaseInspectorPage />} />
          <Route path="audit" element={<AuditLogPage />} />
          <Route path="docs" element={<DocumentationPage />} />
          <Route path="watchdog" element={<WatchdogPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
