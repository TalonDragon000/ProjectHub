import { Link } from 'react-router-dom';
import { Grid3x3, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function NavBar() {
    const { user } = useAuth();

  return (
     <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50 mx-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Grid3x3 className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">ProjectHub</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                to="/leaderboard"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                <Trophy className="w-5 h-5" />
                Leaderboard
              </Link>
              {user ? (
                <Link
                  to="/dashboard"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
}