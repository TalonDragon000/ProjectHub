import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Briefcase, Mail, Settings, LogOut, X, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SideBar() {
  const { profile, activeView, setActiveView, signOut, unreadMessageCount, refreshUnreadCount } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  useEffect(() => {
    if (profile) {
      refreshUnreadCount();
    }
  }, [profile, refreshUnreadCount]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar: slides in on mobile, static on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-200 md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-slate-900">
            ProjectHub
          </Link>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveView('user')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === 'user'
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="font-medium">User View</span>
          </button>

          <button
            onClick={() => setActiveView('creator')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === 'creator'
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-5 h-5" />
            <span className="font-medium">Creator View</span>
          </button>

          <button
            onClick={() => setActiveView('messages')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
              activeView === 'messages'
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5" />
              <span className="font-medium">Messages</span>
            </div>
            {unreadMessageCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                {unreadMessageCount}
              </span>
            )}
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-2">
          <Link
            to={`/profile/${profile?.username}`}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="font-medium truncate">{profile?.display_name}</span>
          </Link>

          <Link
            to="/dashboard/settings"
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </Link>

          <button
            onClick={signOut}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Backdrop when sidebar is open on mobile */}
      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

<main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        {/* Mobile top bar with menu button */}
        <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 md:hidden">
          <Link to="/" className="text-lg font-bold text-slate-900">
            ProjectHub
          </Link>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Open sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
        </main>
    </div>
  );
}