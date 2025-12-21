import { useState, useEffect } from 'react';
import { Rocket, Eye, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProjectIdea } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface IdeaReactionsProps {
  projectId: string;
  compact?: boolean;
  onReactionChange?: (reaction: 'need' | 'curious' | 'rethink' | null) => void;
}

const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem('idea_reaction_session_id');
  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('idea_reaction_session_id', sessionId);
  }
  return sessionId;
};

export default function IdeaReactions({ projectId, compact = false, onReactionChange }: IdeaReactionsProps) {
  const { user, profile } = useAuth();
  const [idea, setIdea] = useState<ProjectIdea | null>(null);
  const [userReaction, setUserReaction] = useState<'need' | 'curious' | 'rethink' | null>(null);
  const [loading, setLoading] = useState(true);
  const [reacting, setReacting] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);

  useEffect(() => {
    loadIdea();
    loadUserReaction();
  }, [projectId, profile]);

  useEffect(() => {
    if (onReactionChange) {
      onReactionChange(userReaction);
    }
  }, [userReaction, onReactionChange]);

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
    // Try loading reaction for authenticated users
    if (profile) {
      const { data } = await supabase
        .from('idea_reactions')
        .select('reaction_type')
        .eq('project_id', projectId)
        .eq('user_id', profile.id)
        .maybeSingle();

      if (data) {
        setUserReaction(data.reaction_type);
        return;
      }
    }

    // Try loading reaction for non-logged users
    const sessionId = getOrCreateSessionId();
    const { data } = await supabase
      .from('idea_reactions')
      .select('reaction_type')
      .eq('project_id', projectId)
      .eq('session_id', sessionId)
      .is('user_id', null)
      .maybeSingle();

    if (data) {
      setUserReaction(data.reaction_type);
    }
  };

  const handleReaction = async (type: 'need' | 'curious' | 'rethink') => {
    setReacting(true);

    try {
      const sessionId = getOrCreateSessionId();
      
      // Handle authenticated users
      if (user && profile) {
        if (userReaction === type) {
          // Remove reaction
          const { error } = await supabase
            .from('idea_reactions')
            .delete()
            .eq('project_id', projectId)
            .eq('user_id', profile.id);

          if (error) {
            console.error('Error removing reaction:', error);
          } else {
            setUserReaction(null);
            await loadIdea();
          }
        } else {
          // Add or update reaction
          const { error } = await supabase.from('idea_reactions').upsert({
            project_id: projectId,
            user_id: profile.id,
            created_by_auth_uid: user.id,
            reaction_type: type,
          });

          if (error) {
            console.error('Error adding or updating reaction:', error);
          } else {
            setUserReaction(type);
            await loadIdea();
          }
        }
      } 
      // Handle anonymous users
      else {
        if (userReaction === type) {
          // Remove reaction
          const { error } = await supabase
            .from('idea_reactions')
            .delete()
            .eq('project_id', projectId)
            .eq('session_id', sessionId)
            .is('user_id', null);

          if (error) {
            console.error('Error removing reaction:', error);
          } else {
            setUserReaction(null);
            await loadIdea();
          }
        } else {
          // For anonymous users, delete old reaction first
          if (userReaction) {
            await supabase
              .from('idea_reactions')
              .delete()
              .eq('project_id', projectId)
              .eq('session_id', sessionId)
              .is('user_id', null);
          }

          // Insert new reaction
          const { error } = await supabase.from('idea_reactions').insert({
            project_id: projectId,
            user_id: null,
            session_id: sessionId,
            reaction_type: type,
            created_by_auth_uid: null,
          });

          if (error) {
            console.error('Error adding or updating reaction:', error);
          } else {
            setUserReaction(type);
            await loadIdea();
          }
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
    <div>
      <h3 className={`font-bold text-slate-900 ${compact ? 'text-lg mb-2' : 'text-xl mb-3'}`}>
        Rate This Idea
      </h3>
      <p className={`text-slate-600 ${compact ? 'text-sm mb-4' : 'mb-6'}`}>
        Help validate this concept—your signal matters
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        {/* Need Button */}
        <div className="relative group">
          <button
            onClick={() => handleReaction('need')}
            disabled={reacting}
            onMouseEnter={() => setTooltipVisible('need')}
            onMouseLeave={() => setTooltipVisible(null)}
            onFocus={() => setTooltipVisible('need')}
            onBlur={() => setTooltipVisible(null)}
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
          {tooltipVisible === 'need' && (
            <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
              Strong validation, high demand signal for this concept
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
            </div>
          )}
        </div>

        {/* Curious Button */}
        <div className="relative group">
          <button
            onClick={() => handleReaction('curious')}
            disabled={reacting}
            onMouseEnter={() => setTooltipVisible('curious')}
            onMouseLeave={() => setTooltipVisible(null)}
            onFocus={() => setTooltipVisible('curious')}
            onBlur={() => setTooltipVisible(null)}
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
          {tooltipVisible === 'curious' && (
            <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
              Interesting idea, but needs more clarity or refinement
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
            </div>
          )}
        </div>

        {/* Rethink Button */}
        <div className="relative group">
          <button
            onClick={() => handleReaction('rethink')}
            disabled={reacting}
            onMouseEnter={() => setTooltipVisible('rethink')}
            onMouseLeave={() => setTooltipVisible(null)}
            onFocus={() => setTooltipVisible('rethink')}
            onBlur={() => setTooltipVisible(null)}
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
          {tooltipVisible === 'rethink' && (
            <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
              Concept may need significant changes or a different approach
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
            </div>
          )}
        </div>
      </div>

      {/* Overall Reactions Bar */}
      {totalReactions > 0 && (
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Overall Reactions</span>
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

      {/* Sign-in prompts */}
      {!profile && !userReaction && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Rate this idea to see community feedback and share your thoughts!
          </p>
        </div>
      )}

      {!profile && userReaction && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Sign in</strong> to earn validator badges and leave a comment!
          </p>
        </div>
      )}
    </div>
  );
}