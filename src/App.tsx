
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { VisualGenerationProvider } from './contexts/VisualGenerationContext';
import MainLayout from './layout/MainLayout';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import ChapterEditor from './pages/ChapterEditor';
import ProtectedRoute from './components/ProtectedRoute';

import WisdomLibraryHome from './pages/WisdomLibraryHome';
import VisualStudioHome from './pages/VisualStudioHome';
import ExportCenterHome from './pages/ExportCenterHome';
import SocialMediaRepurpose from './pages/SocialMediaRepurpose';

function App() {
  return (
    <Router>
      <AuthProvider>
        <VisualGenerationProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="chapters/:id" element={<ChapterEditor />} />
              <Route path="chapters" element={<div className="card"><h2>Chapters</h2><p>Please select a chapter from the dashboard.</p></div>} />
              <Route path="library" element={<WisdomLibraryHome />} />
              <Route path="studio" element={<VisualStudioHome />} />
              <Route path="social-media" element={<SocialMediaRepurpose />} />
              <Route path="export" element={<ExportCenterHome />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </VisualGenerationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

