import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Suspense,lazy } from 'react';
import LoadingFallback from './components/LoadingFallback';

// Lazy load all page components
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectPage = lazy(() => import('./pages/ProjectPage'));
const ProjectForm = lazy(() => import('./pages/ProjectForm'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/project/:slug" element={<ProjectPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/creator/:username" element={<ProfilePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/settings" element={<ProfileSettings />} />
          <Route path="/dashboard/projects/new" element={<ProjectForm />} />
          <Route path="/dashboard/projects/:id/edit" element={<ProjectForm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
