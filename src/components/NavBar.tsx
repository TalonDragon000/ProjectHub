import { Link } from 'react-router-dom';
import { Grid3x3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function NavBar() {
    const { user } = useAuth();

  return (
     <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50 mx-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Grid3x3 className="w-8 h-8 text-indigo-500" />
              <span className="text-xl font-bold text-slate-900">ProjectHub</span>
            </Link>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link to="/dashboard" className="btn-primary">
                  Dashboard
                </Link>
              ) : (
                <Link to="/login" className="btn-primary">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
}