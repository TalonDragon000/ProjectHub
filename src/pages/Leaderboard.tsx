import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Trophy, Award, Zap, Crown, Star, Medal } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  total_xp: number;
  xp_level: number;
  leaderboard_rank: number;
  is_top_100: boolean;
  is_first_100: boolean;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [topUsers, setTopUsers] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();

    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: 'leaderboard_rank=lte.100'
        },
        () => {
          loadLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function loadLeaderboard() {
    try {
      const { data: topData, error: topError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, total_xp, xp_level, leaderboard_rank, is_top_100, is_first_100')
        .eq('is_flagged_bot', false)
        .not('leaderboard_rank', 'is', null)
        .lte('leaderboard_rank', 100)
        .order('leaderboard_rank', { ascending: true });

      if (topError) throw topError;
      setTopUsers(topData || []);

      if (user) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, total_xp, xp_level, leaderboard_rank, is_top_100, is_first_100')
          .eq('user_id', user.id)
          .maybeSingle();

        if (userError) throw userError;
        setUserRank(userData);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }

  function getXPForNextLevel(currentLevel: number): number {
    return (currentLevel * currentLevel) * 100;
  }

  function getRankColor(rank: number): string {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-600';
    return 'text-gray-600';
  }

  function getRankIcon(rank: number) {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />;
    return <Trophy className="w-5 h-5 text-gray-500" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20 px-4 pb-32">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4 shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">XP Leaderboard</h1>
          <p className="text-gray-600">Top 100 creators ranked by experience points</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <div className="divide-y divide-gray-100">
            {topUsers.map((entry) => (
              <Link
                key={entry.id}
                to={`/profile/${entry.username}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-center w-12">
                  {getRankIcon(entry.leaderboard_rank)}
                </div>

                <div className={`text-xl font-bold ${getRankColor(entry.leaderboard_rank)} min-w-[3rem]`}>
                  #{entry.leaderboard_rank}
                </div>

                {entry.avatar_url ? (
                  <img
                    src={entry.avatar_url}
                    alt={entry.display_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {entry.display_name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {entry.display_name}
                    </h3>
                    {entry.is_first_100 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        <Star className="w-3 h-3" />
                        First 100
                      </div>
                    )}
                    {entry.is_top_100 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                        <Award className="w-3 h-3" />
                        Top 100
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">@{entry.username}</p>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-blue-600 font-bold">
                    <Zap className="w-4 h-4" />
                    {entry.total_xp.toLocaleString()} XP
                  </div>
                  <p className="text-sm text-gray-500">Level {entry.xp_level}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {userRank && userRank.leaderboard_rank && userRank.leaderboard_rank > 100 && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg p-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Your Rank</p>
                <p className="text-3xl font-bold">#{userRank.leaderboard_rank}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm mb-1">Your XP</p>
                <div className="flex items-center gap-1 text-2xl font-bold">
                  <Zap className="w-5 h-5" />
                  {userRank.total_xp.toLocaleString()}
                </div>
                <p className="text-blue-100 text-sm">Level {userRank.xp_level}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-400">
              <p className="text-sm text-blue-100">
                Keep earning XP to climb the ranks! You need{' '}
                <span className="font-bold">
                  {topUsers[99] ? (topUsers[99].total_xp - userRank.total_xp + 1).toLocaleString() : '?'} more XP
                </span>{' '}
                to reach the Top 100.
              </p>
            </div>
          </div>
        )}

        {!user && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center mt-6">
            <Trophy className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Join the Competition!</h3>
            <p className="text-gray-600 mb-4">
              Sign in to track your rank and compete with other creators for the top spot.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}

        {userRank && userRank.leaderboard_rank && userRank.leaderboard_rank <= 100 && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl shadow-lg p-6 mt-6">
            <div className="flex items-center gap-3 mb-3">
              <Crown className="w-8 h-8" />
              <h3 className="text-2xl font-bold">You're in the Top 100!</h3>
            </div>
            <p className="text-yellow-50">
              Congratulations! You're ranked #{userRank.leaderboard_rank} with {userRank.total_xp.toLocaleString()} XP.
              Keep creating amazing projects to maintain your position!
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">How to Earn XP</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold">+50</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Publish Your First Project</h4>
                <p className="text-sm text-gray-600">One-time bonus for your first published project</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">+10</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Publish Additional Projects</h4>
                <p className="text-sm text-gray-600">Earn XP for each project you publish</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">+5</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Submit Project Ideas & Receive Reviews</h4>
                <p className="text-sm text-gray-600">Share your ideas and get feedback on your projects</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 font-bold">+2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Get Idea Reactions</h4>
                <p className="text-sm text-gray-600">Earn XP when users react to your project ideas</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-yellow-600 font-bold">+1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Get Project Demo Views</h4>
                <p className="text-sm text-gray-600">Earn XP when users view your project demos (max 1 per viewer)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {userRank && userRank.leaderboard_rank && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {userRank.avatar_url ? (
                  <img
                    src={userRank.avatar_url}
                    alt={userRank.display_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {userRank.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{userRank.display_name}</p>
                  <p className="text-xs text-gray-500">Rank #{userRank.leaderboard_rank}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-blue-600 font-bold">
                  <Zap className="w-4 h-4" />
                  {userRank.total_xp.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">Level {userRank.xp_level}</p>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Level {userRank.xp_level}</span>
                <span>Level {userRank.xp_level + 1}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      ((userRank.total_xp - getXPForNextLevel(userRank.xp_level - 1)) /
                        (getXPForNextLevel(userRank.xp_level) - getXPForNextLevel(userRank.xp_level - 1))) *
                      100
                    }%`
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {(getXPForNextLevel(userRank.xp_level) - userRank.total_xp).toLocaleString()} XP to next level
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
