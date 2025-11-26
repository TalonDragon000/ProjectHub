import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from('creator_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (!profile) {
          const displayName = session.user.user_metadata?.full_name ||
                             session.user.user_metadata?.name ||
                             session.user.email?.split('@')[0] ||
                             'Creator';

          await supabase.from('creator_profiles').insert([
            {
              user_id: session.user.id,
              display_name: displayName,
              avatar_url: session.user.user_metadata?.avatar_url,
            },
          ]);
        }

        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Completing sign in...</p>
      </div>
    </div>
  );
}
