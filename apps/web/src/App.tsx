import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';

const Landing = lazy(() => import('./pages/Landing'));
const Wizard = lazy(() => import('./pages/Wizard'));
const Results = lazy(() => import('./pages/Results'));
const UseCaseAssistant = lazy(() => import('./pages/UseCaseAssistant'));
const CopilotStudioReleaseDates = lazy(() => import('./pages/CopilotStudioReleaseDates'));
const FoundryNews = lazy(() => import('./pages/FoundryNews'));
const ReadinessAssessment = lazy(() => import('./pages/ReadinessAssessment'));
const ProfileSummary = lazy(() => import('./pages/ProfileSummary'));
const ImplementationGuide = lazy(() => import('./pages/ImplementationGuide'));
const CopilotStudioMindMap = lazy(() => import('./pages/CopilotStudioMindMap'));
const ExecutiveOverview = lazy(() => import('./pages/ExecutiveOverview'));

function PageLoadingFallback() {
  return (
    <div className="flex min-h-64 items-center justify-center" role="status" aria-live="polite">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading page...</span>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="wizard" element={<Wizard />} />
          <Route path="results" element={<Results />} />
          <Route path="roadmap" element={<Navigate to="/use-cases" replace />} />
          <Route path="use-cases" element={<UseCaseAssistant />} />
          <Route path="copilot-studio-release-dates" element={<CopilotStudioReleaseDates />} />
          <Route path="foundry-news" element={<FoundryNews />} />
          <Route path="readiness" element={<ReadinessAssessment />} />
          <Route path="implementation-guide" element={<ImplementationGuide />} />
          <Route path="mind-maps" element={<CopilotStudioMindMap />} />
          <Route path="executive-overview" element={<ExecutiveOverview />} />
          <Route path="copilot-studio-mind-map" element={<Navigate to="/mind-maps" replace />} />
          <Route path="profile-summary" element={<ProfileSummary />} />
          {__ENABLE_ADMIN__ && (
            <Route
              path="admin"
              lazy={async () => {
                const { default: Admin } = await import('./pages/Admin');
                return { Component: Admin };
              }}
            />
          )}
        </Route>
      </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
