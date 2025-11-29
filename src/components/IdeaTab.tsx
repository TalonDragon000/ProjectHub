import { useState, useEffect } from 'react';
import { Flame, Snowflake, Info, Users, UsersRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProjectIdea, IdeaReaction } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface IdeaTabProps {
  projectId: string;
}

export default function IdeaTab({ projectId }: IdeaTabProps) {
  const { profile } = useAuth();
  const [idea, setIdea] = useState<ProjectIdea | null>(null);
  const [userReaction, setUserReaction] = useState<'hot' | 'cold' | null>(null);
  const [loading, setLoading] = useState(true);
  const [reacting, setReacting] = useState(false);

  useEffect(() => {
    loadIdea();
    if (profile) {
      loadUserReaction();
    }
  }, [projectId, profile]);

  const loadIdea = async () => {
    const { data, error } = await supabase
      .from('project_ideas')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (data && !error) {
      setIdea(data);
    }
    setLoading(false);
  };

  const loadUserReaction = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('idea_reactions')
      .select('reaction_type')
      .eq('project_id', projectId)
      .eq('user_id', profile.id)
      .maybeSingle();

    if (data) {
      setUserReaction(data.reaction_type);
    }
  };

  const handleReaction = async (type: 'hot' | 'cold') => {
    if (!profile) {
      alert('Please sign in to react to this idea');
      return;
    }

    setReacting(true);

    try {
      if (userReaction === type) {
        const { error } = await supabase
          .from('idea_reactions')
          .delete()
          .eq('project_id', projectId)
          .eq('user_id', profile.id);

        if (!error) {
          setUserReaction(null);
          await loadIdea();
        }
      } else {
        const { error } = await supabase.from('idea_reactions').upsert({
          project_id: projectId,
          user_id: profile.id,
          reaction_type: type,
        });

        if (!error) {
          setUserReaction(type);
          await loadIdea();
        }
      }
    } catch (err) {
      console.error('Error reacting:', err);
    } finally {
      setReacting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-slate-600">Loading idea details...</div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="bg-slate-50 rounded-lg p-8 text-center">
        <p className="text-slate-600">No idea details available for this project yet.</p>
      </div>
    );
  }

  const totalReactions = idea.hot_count + idea.cold_count;
  const hotPercentage = totalReactions > 0 ? Math.round((idea.hot_count / totalReactions) * 100) : 0;
  const coldPercentage = totalReactions > 0 ? Math.round((idea.cold_count / totalReactions) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-8 border border-amber-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.061 1.06l1.06 1.061z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">The Idea</h2>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Problem Area
          </h3>
          <p className="text-slate-900 text-lg leading-relaxed whitespace-pre-wrap">
            {idea.problem_area}
          </p>
        </div>

        {idea.keywords && idea.keywords.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
              Keywords
            </h3>
            <div className="flex flex-wrap gap-2">
              {idea.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors cursor-default"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2 mb-6">
          {idea.collaboration_open ? (
            <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
              <UsersRound className="w-4 h-4" />
              <span className="font-medium text-sm">Open to Collaboration</span>
              <div className="group relative">
                <Info className="w-4 h-4 text-green-600 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-900 text-white text-xs rounded shadow-lg z-10">
                  This creator is open to collaboration opportunities and welcomes discussions about working together on this project
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg">
              <Users className="w-4 h-4" />
              <span className="font-medium text-sm">Not Seeking Collaborators</span>
              <div className="group relative">
                <Info className="w-4 h-4 text-slate-500 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-900 text-white text-xs rounded shadow-lg z-10">
                  This creator is not currently looking for collaborators on this project
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Rate This Idea</h3>
        <p className="text-slate-600 mb-6">
          Let the creator know what you think about their idea concept. Is it hot or not?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => handleReaction('hot')}
            disabled={reacting}
            className={`group relative flex flex-col items-center justify-center p-8 rounded-xl border-2 transition-all ${
              userReaction === 'hot'
                ? 'bg-orange-50 border-orange-500 shadow-lg scale-105'
                : 'bg-white border-slate-200 hover:border-orange-400 hover:bg-orange-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Flame
              className={`w-16 h-16 mb-3 transition-colors ${
                userReaction === 'hot' ? 'text-orange-500' : 'text-slate-400 group-hover:text-orange-500'
              }`}
            />
            <span className="text-3xl font-bold text-slate-900 mb-1">{idea.hot_count}</span>
            <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">Hot</span>
            {totalReactions > 0 && (
              <span className="text-xs text-slate-500 mt-1">{hotPercentage}%</span>
            )}
            {userReaction === 'hot' && (
              <div className="absolute top-3 right-3 px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
                Your Vote
              </div>
            )}
          </button>

          <button
            onClick={() => handleReaction('cold')}
            disabled={reacting}
            className={`group relative flex flex-col items-center justify-center p-8 rounded-xl border-2 transition-all ${
              userReaction === 'cold'
                ? 'bg-blue-50 border-blue-500 shadow-lg scale-105'
                : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Snowflake
              className={`w-16 h-16 mb-3 transition-colors ${
                userReaction === 'cold' ? 'text-blue-500' : 'text-slate-400 group-hover:text-blue-500'
              }`}
            />
            <span className="text-3xl font-bold text-slate-900 mb-1">{idea.cold_count}</span>
            <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">Cold</span>
            {totalReactions > 0 && (
              <span className="text-xs text-slate-500 mt-1">{coldPercentage}%</span>
            )}
            {userReaction === 'cold' && (
              <div className="absolute top-3 right-3 px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                Your Vote
              </div>
            )}
          </button>
        </div>

        {totalReactions > 0 && (
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Overall Sentiment</span>
              <span className="text-sm text-slate-600">{totalReactions} total reactions</span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden flex">
              <div
                className="bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500"
                style={{ width: `${hotPercentage}%` }}
              />
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500"
                style={{ width: `${coldPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-600">
              <span>🔥 {hotPercentage}% Hot</span>
              <span>❄️ {coldPercentage}% Cold</span>
            </div>
          </div>
        )}

        {!profile && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Sign in</strong> to react to this idea and let the creator know what you think!
            </p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-6 border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-2">About Idea Ratings</h4>
        <p className="text-sm text-slate-600">
          Idea ratings help creators understand if their concept resonates with the community before investing heavily in execution.
          "Hot" reactions indicate strong interest and validation, while "Cold" reactions suggest the concept may need refinement.
          These ratings are separate from project execution reviews to help distinguish between concept validation and implementation quality.
        </p>
      </div>
    </div>
  );
}
