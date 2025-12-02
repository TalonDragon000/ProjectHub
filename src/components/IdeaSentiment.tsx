import { useState, useEffect } from 'react';
import { Rocket, Eye, RefreshCw, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProjectIdea } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface IdeaSentimentProps {
  projectId: string;
  compact?: boolean;
  showDetails?: boolean;
}

export default function IdeaSentiment({ projectId, compact = false, showDetails = true }: IdeaSentimentProps) {
  const { profile } = useAuth();
  const [idea, setIdea] = useState<ProjectIdea | null>(null);
  const [userReaction, setUserReaction] = useState<'need' | 'curious' | 'rethink' | null>(null);
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

  const handleReaction = async (type: 'need' | 'curious' | 'rethink') => {
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
      <div className="flex items-center justify-center py-6">
        <div className="text-sm text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!idea) {
    return null;
  }

  const totalReactions = idea.need_count + idea.curious_count + idea.rethink_count;
  const needPercentage = totalReactions > 0 ? Math.round((idea.need_count / totalReactions) * 100) : 0;
  const curiousPercentage = totalReactions > 0 ? Math.round((idea.curious_count / totalReactions) * 100) : 0;
  const rethinkPercentage = totalReactions > 0 ? Math.round((idea.rethink_count / totalReactions) * 100) : 0;

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      <div>
        <h3 className={`font-bold text-slate-900 ${compact ? 'text-lg mb-2' : 'text-xl mb-3'}`}>
          Rate This Idea
        </h3>
        <p className={`text-slate-600 ${compact ? 'text-sm mb-4' : 'mb-6'}`}>
          Help validate this concept—your signal matters
        </p>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => handleReaction('need')}
            disabled={reacting}
            className={`relative inline-flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
              userReaction === 'need'
                ? 'bg-green-50 border-green-500 shadow-md'
                : 'bg-white border-slate-200 hover:border-green-400 hover:bg-green-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Rocket
              className={`w-5 h-5 transition-colors ${
                userReaction === 'need' ? 'text-green-600' : 'text-slate-400 group-hover:text-green-600'
              }`}
            />
            <span className="font-medium text-slate-900">Need this</span>
            <span className={`font-bold ${userReaction === 'need' ? 'text-green-600' : 'text-slate-600'}`}>
              {idea.need_count}
            </span>
            {userReaction === 'need' && (
              <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full">
                Your vote
              </span>
            )}
          </button>

          <button
            onClick={() => handleReaction('curious')}
            disabled={reacting}
            className={`relative inline-flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
              userReaction === 'curious'
                ? 'bg-amber-50 border-amber-500 shadow-md'
                : 'bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Eye
              className={`w-5 h-5 transition-colors ${
                userReaction === 'curious' ? 'text-amber-600' : 'text-slate-400 group-hover:text-amber-600'
              }`}
            />
            <span className="font-medium text-slate-900">Curious</span>
            <span className={`font-bold ${userReaction === 'curious' ? 'text-amber-600' : 'text-slate-600'}`}>
              {idea.curious_count}
            </span>
            {userReaction === 'curious' && (
              <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-amber-500 text-white text-xs font-semibold rounded-full">
                Your vote
              </span>
            )}
          </button>

          <button
            onClick={() => handleReaction('rethink')}
            disabled={reacting}
            className={`relative inline-flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
              userReaction === 'rethink'
                ? 'bg-slate-50 border-slate-500 shadow-md'
                : 'bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <RefreshCw
              className={`w-5 h-5 transition-colors ${
                userReaction === 'rethink' ? 'text-slate-600' : 'text-slate-400 group-hover:text-slate-600'
              }`}
            />
            <span className="font-medium text-slate-900">Rethink</span>
            <span className={`font-bold ${userReaction === 'rethink' ? 'text-slate-600' : 'text-slate-600'}`}>
              {idea.rethink_count}
            </span>
            {userReaction === 'rethink' && (
              <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-slate-500 text-white text-xs font-semibold rounded-full">
                Your vote
              </span>
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
                className="bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                style={{ width: `${needPercentage}%` }}
              />
              <div
                className="bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                style={{ width: `${curiousPercentage}%` }}
              />
              <div
                className="bg-gradient-to-r from-slate-400 to-slate-500 transition-all duration-500"
                style={{ width: `${rethinkPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-600">
              <span>Need this {needPercentage}%</span>
              <span>Curious {curiousPercentage}%</span>
              <span>Rethink {rethinkPercentage}%</span>
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

      {showDetails && (
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-900 mb-2 text-sm">What each rating means</h4>
              <ul className="text-xs text-slate-600 space-y-1">
                <li><strong>Need this:</strong> Strong validation, high demand signal for this concept</li>
                <li><strong>Curious:</strong> Interesting idea, but needs more clarity or refinement</li>
                <li><strong>Rethink:</strong> Concept may need significant changes or a different approach</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
