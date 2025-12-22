import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import MessagesView from '../components/MessagesView';
import CreatorWelcomeScreen from '../components/CreatorWelcomeScreen';
import SideBar from '../components/SideBar';
import UserView from '../components/UserView';
import CreatorView from '../components/CreatorView';

export default function Dashboard() {
  const { user, profile, activeView, refreshUnreadCount } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (profile) {
      refreshUnreadCount();
      setLoading(false);
    }
  }, [user, profile, activeView]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-xl text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-h-screen bg-slate-50 flex">
      <SideBar />
      <div className="flex-1 mx-auto overflow-y-auto px-8">
        <div className="flex flex-col py-8">
        {activeView === 'user' ? (
            <UserView />
          ) : activeView === 'creator' ? (
            profile?.is_creator ? (
              <CreatorView />
            ) : (
              <CreatorWelcomeScreen />
            )
           ) : ( activeView === 'messages' ? (
            <div className="h-[calc(100vh-8rem)]">
              <MessagesView />
            </div>
            ) : null 
          )}
        </div>
        </div>
      </div>
  );
}