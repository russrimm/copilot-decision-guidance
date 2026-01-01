import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Landing from './pages/Landing';
import Wizard from './pages/Wizard';
import Results from './pages/Results';
import Admin from './pages/Admin';
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
            <Route path="admin" element={<Admin />} />
          </Route>
        </Routes>
        {/* Floating Copilot Agent - Available on all pages */}
        <CopilotAgent variant="floating" />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
