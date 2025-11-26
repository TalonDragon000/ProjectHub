import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectPage from './pages/ProjectPage';
import ProjectForm from './pages/ProjectForm';
import AuthCallback from './pages/AuthCallback';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/project/:slug" element={<ProjectPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/projects/new" element={<ProjectForm />} />
          <Route path="/dashboard/projects/:id/edit" element={<ProjectForm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
