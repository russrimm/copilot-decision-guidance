import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Landing from './pages/Landing';
import Wizard from './pages/Wizard';
import Results from './pages/Results';
import UseCaseAssistant from './pages/UseCaseAssistant';
import CopilotStudioReleaseDates from './pages/CopilotStudioReleaseDates';
import FoundryNews from './pages/FoundryNews';
import ReadinessAssessment from './pages/ReadinessAssessment';
import ProfileSummary from './pages/ProfileSummary';
import ImplementationGuide from './pages/ImplementationGuide';
import CopilotStudioMindMap from './pages/CopilotStudioMindMap';
import Layout from './components/Layout';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
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
            <Route path="copilot-studio-mind-map" element={<CopilotStudioMindMap />} />
            <Route path="profile-summary" element={<ProfileSummary />} />
            {/* Admin route excluded from production builds via __ENABLE_ADMIN__ flag */}
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
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
