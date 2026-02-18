import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Landing from './pages/Landing';
import Wizard from './pages/Wizard';
import Results from './pages/Results';
import Roadmap from './pages/Roadmap';
import UseCaseAssistant from './pages/UseCaseAssistant';
import CopilotStudioReleaseDates from './pages/CopilotStudioReleaseDates';
import ReadinessAssessment from './pages/ReadinessAssessment';
import PortfolioPrioritizer from './pages/PortfolioPrioritizer';
import Layout from './components/Layout';
import { CopilotAgent } from './components/CopilotAgent';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="wizard" element={<Wizard />} />
            <Route path="results" element={<Results />} />
            <Route path="roadmap" element={<Roadmap />} />
            <Route path="use-cases" element={<UseCaseAssistant />} />
            <Route path="copilot-studio-release-dates" element={<CopilotStudioReleaseDates />} />
            <Route path="readiness" element={<ReadinessAssessment />} />
            <Route path="portfolio-prioritizer" element={<PortfolioPrioritizer />} />
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
        {/* Floating Copilot Agent - Available on all pages */}
        <CopilotAgent variant="floating" />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
