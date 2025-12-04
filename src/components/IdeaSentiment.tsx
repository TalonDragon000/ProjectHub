import { useState, useEffect } from 'react';
import { Rocket, Eye, RefreshCw, MessageSquare, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProjectIdea, QuickFeedback, Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

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
  const [feedback, setFeedback] = useState<(QuickFeedback & { profile?: Profile })[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    const storedSessionId = localStorage.getItem('projecthub_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('projecthub_session_id', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  useEffect(() => {
    loadIdea();
    loadFeedback();
    if (sessionId) {
      loadUserReaction();
    }
  }, [projectId, profile, sessionId]);

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
    if (profile) {
      const { data } = await supabase
        .from('idea_reactions')
        .select('reaction_type')
        .eq('project_id', projectId)
        .eq('user_id', profile.id)
        .maybeSingle();

      if (data) {
        setUserReaction(data.reaction_type);
      }
    } else if (sessionId) {
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
    }
  };

  const handleReaction = async (type: 'need' | 'curious' | 'rethink') => {
    if (!sessionId) return;

    setReacting(true);

    try {
      if (userReaction === type) {
        if (profile) {
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
          const { error } = await supabase
            .from('idea_reactions')
            .delete()
            .eq('project_id', projectId)
            .eq('session_id', sessionId)
            .is('user_id', null);

          if (!error) {
            setUserReaction(null);
            await loadIdea();
          }
        }
      } else {
        if (profile) {
          const { error } = await supabase.from('idea_reactions').upsert({
            project_id: projectId,
            user_id: profile.id,
            reaction_type: type,
          });

          if (!error) {
            setUserReaction(type);
            await loadIdea();
          }
        } else {
          if (userReaction) {
            await supabase
              .from('idea_reactions')
              .delete()
              .eq('project_id', projectId)
              .eq('session_id', sessionId)
              .is('user_id', null);
          }

          const { error } = await supabase.from('idea_reactions').insert({
            project_id: projectId,
            session_id: sessionId,
            reaction_type: type,
            user_id: null,
          });

          if (!error) {
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

  const loadFeedback = async () => {
    const { data, error } = await supabase
      .from('quick_feedback')
      .select(`
        *,
        profile:user_id (
          id,
          display_name,
          username,
          avatar_url
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setFeedback(data as any);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;

    setSubmittingFeedback(true);

    try {
      const { error } = await supabase.from('quick_feedback').insert({
        project_id: projectId,
        message: feedbackMessage.trim(),
        user_id: profile?.user_id || null,
        reaction_type: userReaction,
      });

      if (!error) {
        setFeedbackMessage('');
        setFeedbackSuccess(true);
        await loadFeedback();
        setTimeout(() => setFeedbackSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setSubmittingFeedback(false);
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
              <strong>Sign in</strong> to earn validator badges and build your reputation!
            </p>
          </div>
        )}
      </div>

      {userReaction && (
        <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-slate-600" />
            <span>Share Your Thoughts</span>
          </h3>
          {feedback.length > 0 && (
            <span className="text-sm text-slate-600">{feedback.length} {feedback.length === 1 ? 'comment' : 'comments'}</span>
          )}
        </div>

        <form onSubmit={handleSubmitFeedback} className="mb-6">
          <textarea
            value={feedbackMessage}
            onChange={(e) => setFeedbackMessage(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            placeholder="Share your thoughts: affirm, question, suggest alternatives, or share your experience..."
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-500">
              {feedbackMessage.length}/500 characters
            </span>
            <button
              type="submit"
              disabled={submittingFeedback || !feedbackMessage.trim()}
              className="inline-flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingFeedback ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : feedbackSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Sent!</span>
                </>
              ) : (
                <span>Share Feedback</span>
              )}
            </button>
          </div>
        </form>

        {feedback.length > 0 && (
          <div className="space-y-3">
            {feedback.map((item) => {
              const bgColor = item.reaction_type === 'need'
                ? 'bg-green-50 border-green-100'
                : item.reaction_type === 'curious'
                ? 'bg-amber-50 border-amber-100'
                : item.reaction_type === 'rethink'
                ? 'bg-slate-50 border-slate-100'
                : 'bg-slate-50 border-slate-100';

              return (
                <div key={item.id} className={`rounded-lg p-4 border ${bgColor}`}>
                  <div className="flex items-start space-x-3">
                    {item.profile ? (
                      <div className="flex-shrink-0">
                        {item.profile.avatar_url ? (
                          <img
                            src={item.profile.avatar_url}
                            alt={item.profile.display_name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center">
                            <span className="text-xs font-medium text-slate-600">
                              {item.profile.display_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-slate-500">?</span>
                        </div>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {item.profile ? (
                          <span className="text-sm font-medium text-slate-900">
                            {item.profile.display_name}
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-slate-500">Anonymous</span>
                        )}
                        <span className="text-xs text-slate-500">
                          {format(new Date(item.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{item.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {feedback.length === 0 (
          <div className="text-center py-8 text-slate-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No feedback yet. Be the first to share your thoughts!</p>
          </div>
        ), (loadFeedback)}
        </div>
      )}
    </div>
  );
}
