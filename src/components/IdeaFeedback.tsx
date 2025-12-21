import { useState, useEffect } from 'react';
import { MessageSquare, Check, Edit, Trash2, Save, Ban, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { QuickFeedback, Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface IdeaFeedbackProps {
  projectId: string;
  userReaction?: 'need' | 'curious' | 'rethink' | null;
  compact?: boolean;
}

export default function IdeaFeedback({ projectId, userReaction, compact = false }: IdeaFeedbackProps) {
  const { user, profile } = useAuth();
  const [feedback, setFeedback] = useState<(QuickFeedback & { profile?: Profile })[]>([]);
  const [existingFeedback, setExistingFeedback] = useState<(QuickFeedback & { profile?: Profile }) | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [editAnonymously, setEditAnonymously] = useState(false);

  useEffect(() => {
    if (profile) {
      setPostAnonymously(profile.post_feedback_anonymously ?? false);
    }
  }, [profile]);

  useEffect(() => {
    loadFeedback();
  }, [projectId]);

  const loadFeedback = async () => {
    const { data, error } = await supabase
      .from('quick_feedback')
      .select(`
        *,
        profile:profiles (
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

      if (profile) {
        const userFeedback = data.find(f => f.user_id === profile.id);
        setExistingFeedback(userFeedback || null);
      }
    }
  };

  const canEditFeedback = (item: QuickFeedback) => {
    if (!user) return false;
    return item.created_by_auth_uid === user.id;
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim() || !user || !profile || !userReaction) return;

    // Verify reaction exists before submitting
    const { data: reactionData } = await supabase
    .from('idea_reactions')
    .select('reaction_type')
    .eq('project_id', projectId)
    .eq('user_id', profile.id)
    .maybeSingle();

    if (!reactionData) {
      console.error('You must rate this idea before sharing feedback.');
      return;
    }

    setSubmittingFeedback(true);

    try {
      const feedbackData: any = {
        project_id: projectId,
        message: feedbackMessage.trim(),
        reaction_type: reactionData.reaction_type,
        created_by_auth_uid: user.id,
        user_id: profile.id,
        feedback_identity_public: !postAnonymously,
      };

      if (postAnonymously) {
        feedbackData.feedback_identity_public = !postAnonymously;
      }

      const { error } = await supabase.from('quick_feedback').insert(feedbackData);

      if (!error) {
        setFeedbackMessage('');
        setFeedbackSuccess(true);
        setPostAnonymously(profile?.post_feedback_anonymously ?? false);
        await loadFeedback();
        setTimeout(() => setFeedbackSuccess(false), 3000);
      }
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      alert(`Failed to submit feedback: ${error.message}`);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleStartEditFeedback = (item: QuickFeedback) => {
    setEditingFeedbackId(item.id);
    setEditMessage(item.message);
    setEditAnonymously(!item.feedback_identity_public);
  };

  const handleCancelEditFeedback = () => {
    setEditingFeedbackId(null);
    setEditMessage('');
    setEditAnonymously(false);
  };

  const handleSaveEditFeedback = async () => {
    if (!editMessage.trim() || !editingFeedbackId) return;

    try {
      const updateData: any = {
        message: editMessage.trim(),
        last_edited_at: new Date().toISOString(),
        feedback_identity_public: !editAnonymously,
      };

      const { error } = await supabase
        .from('quick_feedback')
        .update(updateData)
        .eq('id', editingFeedbackId);

      if (!error) {
        setEditingFeedbackId(null);
        setEditMessage('');
        setEditAnonymously(false);
        await loadFeedback();
      }
      else {
        console.error('Error updating feedback:', error);
        alert(`Failed to update feedback: ${error.message}`);
      }
    } catch (err) {
      console.error('Error updating feedback:', err);
      alert(`Failed to update feedback: ${err}`);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const { error } = await supabase
        .from('quick_feedback')
        .delete()
        .eq('id', feedbackId);

      if (!error) {
        await loadFeedback();
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
    }
  };

  // Don't show feedback section if user hasn't reacted
  if (!userReaction) {
    return null;
  }

  return (
    <div className="border-t border-slate-200 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-slate-600" />
          <span>Share Your Thoughts</span>
        </h3>
        {feedback.length > 0 && (
          <span className="text-sm text-slate-600">
            {feedback.length} {feedback.length === 1 ? 'comment' : 'comments'}
          </span>
        )}
      </div>

      {/* Feedback Form */}
      {profile && !existingFeedback ? (
        <form onSubmit={handleSubmitFeedback} className="mb-6 space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <input
              type="checkbox"
              id="postFeedbackAnonymously"
              checked={postAnonymously}
              onChange={(e) => setPostAnonymously(e.target.checked)}
              className="w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500 mt-0.5"
            />
            <div className="flex-1">
              <label htmlFor="postFeedbackAnonymously" className="text-sm font-medium text-slate-900 block cursor-pointer">
                Post anonymously
              </label>
              <p className="text-xs text-slate-600 mt-0.5">
                {postAnonymously
                  ? 'Your name will not appear on this feedback'
                  : 'Your name will appear with this feedback'}
              </p>
            </div>
          </div>
          <textarea
            value={feedbackMessage}
            onChange={(e) => setFeedbackMessage(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            placeholder="Share your thoughts: affirm, question, suggest alternatives, or share your experience..."
          />
          <div className="flex items-center justify-between">
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
      ) : profile && existingFeedback ? (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            You already shared your feedback for this project. You can edit your existing feedback below.
          </p>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <Link to="/login" className="font-semibold underline">
              Sign in
            </Link>{' '}
            to share your feedback and join the conversation.
          </p>
        </div>
      )}

      {/* Feedback List */}
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
                {editingFeedbackId === item.id ? (
                  <div className="space-y-3">
                    {profile && (
                      <div className="flex items-start space-x-3 p-2 bg-white border border-slate-200 rounded">
                        <input
                          type="checkbox"
                          id="editFeedbackAnonymously"
                          checked={editAnonymously}
                          onChange={(e) => setEditAnonymously(e.target.checked)}
                          className="w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500 mt-0.5"
                        />
                        <label htmlFor="editFeedbackAnonymously" className="text-xs text-slate-700">
                          Post anonymously
                        </label>
                      </div>
                    )}
                    <textarea
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      rows={3}
                      maxLength={500}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm"
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSaveEditFeedback}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        <Save className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancelEditFeedback}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-slate-200 text-slate-700 rounded text-sm hover:bg-slate-300 transition-colors"
                      >
                        <Ban className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-3">
                    {item.profile && item.feedback_identity_public ? (
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
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          {item.profile && item.feedback_identity_public ? (
                            <span className="text-sm font-medium text-slate-900">
                              {item.profile.display_name}
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-slate-500">Anonymous</span>
                          )}
                          <span className="text-xs text-slate-500">
                            {format(new Date(item.created_at), 'MMM d, yyyy')}
                            {item.last_edited_at && (
                              <span className="ml-1 text-xs text-slate-400">(edited)</span>
                            )}
                          </span>
                        </div>
                        
                        {canEditFeedback(item) && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleStartEditFeedback(item)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit feedback"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFeedback(item.id)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete feedback"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{item.message}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {feedback.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm">No feedback yet. Be the first to share your thoughts!</p>
        </div>
      )}
    </div>
  );
}
